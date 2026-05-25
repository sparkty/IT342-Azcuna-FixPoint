package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.dto.CreateIssueRequest;
import edu.cit.azcuna.fixpoint.dto.IssueResponse;
import edu.cit.azcuna.fixpoint.dto.UpdateIssueRequest;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.IssueRepository;
import edu.cit.azcuna.fixpoint.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;


import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final EmailService emailService;


    public IssueResponse create(CreateIssueRequest request, MultipartFile attachment, User currentUser) {
        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .priority(request.getPriority() != null ? request.getPriority() : Issue.Priority.MEDIUM)
                .status(Issue.Status.PENDING)
                .user(currentUser)
                .build();

        if (attachment != null && !attachment.isEmpty()) {
            try {
                String storedName = fileStorageService.store(attachment);
                issue.setAttachmentFilename(storedName);
                issue.setAttachmentOriginalName(attachment.getOriginalFilename());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store attachment.");
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
        }

        Issue saved = issueRepository.save(issue);
        return IssueResponse.from(saved, getDisplayId(saved), false);
    }

    @Transactional(readOnly = true)
    public Page<IssueResponse> list(Issue.Status status, Issue.Category category,
                                    int page, int size, User currentUser) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        Page<Issue> result;

        if (isAdmin) {
            if (status != null && category != null)
                result = issueRepository.findByStatusAndCategory(status, category, pageable);
            else if (status != null)
                result = issueRepository.findByStatus(status, pageable);
            else if (category != null)
                result = issueRepository.findByCategory(category, pageable);
            else
                result = issueRepository.findAll(pageable);
        } else {
            if (status != null && category != null)
                result = issueRepository.findByUserAndStatusAndCategory(currentUser, status, category, pageable);
            else if (status != null)
                result = issueRepository.findByUserAndStatus(currentUser, status, pageable);
            else if (category != null)
                result = issueRepository.findByUserAndCategory(currentUser, category, pageable);
            else
                result = issueRepository.findByUser(currentUser, pageable);
        }

        return result.map(issue -> IssueResponse.from(issue, getDisplayId(issue), false));
    }

    @Transactional(readOnly = true)
    public IssueResponse getById(Long routeId, User currentUser) {
        Issue issue = findAndAuthorize(routeId, currentUser);
        return IssueResponse.from(issue, getDisplayId(issue), true);
    }

    public IssueResponse update(Long routeId, UpdateIssueRequest request, User currentUser) {
        Issue issue = findAndAuthorize(routeId, currentUser);
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;

        if (request.getDescription() != null)
            issue.setDescription(request.getDescription());

        if (request.getStatus() != null) {
            if (!isAdmin)
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can change issue status.");

            Issue.Status oldStatus = issue.getStatus(); // ← capture before change
            issue.setStatus(request.getStatus());

            if (request.getStatus() == Issue.Status.RESOLVED)
                issue.setResolvedAt(LocalDateTime.now());

            Issue saved = issueRepository.save(issue);

            // ── Fire notification to issue owner ──────────────────────────────
            notificationService.createStatusUpdateNotification(saved, oldStatus, request.getStatus());

            if (!Boolean.FALSE.equals(saved.getUser().getEmailNotificationsEnabled())) {
                emailService.sendStatusUpdateEmail(
                saved.getUser().getEmail(),
                saved.getUser().getFirstname(),
                getDisplayId(saved),
                saved.getTitle(),
                saved.getStatus().name()
                );
            }

            return IssueResponse.from(saved, getDisplayId(saved), true);
        }

        Issue saved = issueRepository.save(issue);
        return IssueResponse.from(saved, getDisplayId(saved), true);
    }

    public void delete(Long id, User currentUser) {
        if (currentUser.getRole() != User.Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can delete issues.");

        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found."));

        if (issue.getAttachmentFilename() != null)
            fileStorageService.delete(issue.getAttachmentFilename());

        issueRepository.delete(issue);
    }

    private Issue findAndAuthorize(Long routeId, User currentUser) {
        Issue issue = findByRouteId(routeId, currentUser);

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = issue.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this issue.");

        return issue;
    }
    
    private Issue findByRouteId(Long routeId, User currentUser) {
        if (currentUser.getRole() == User.Role.ADMIN) {
            return issueRepository.findById(routeId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found."));
        }

        List<Issue> userIssues = issueRepository.findByUserOrderByIdAsc(currentUser);
        int index = Math.toIntExact(routeId - 1);
        if (index < 0 || index >= userIssues.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found.");
        }

        return userIssues.get(index);
    }

    private Long getDisplayId(Issue issue) {
        return issueRepository.countByUserAndIdLessThanEqual(issue.getUser(), issue.getId());
    }
}
