package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.dto.CreateIssueCommentRequest;
import edu.cit.azcuna.fixpoint.dto.IssueCommentResponse;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.IssueComment;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.IssueCommentRepository;
import edu.cit.azcuna.fixpoint.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueCommentService {

    private final IssueRepository issueRepository;
    private final IssueCommentRepository issueCommentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<IssueCommentResponse> list(Long issueId, User currentUser) {
        Issue issue = findAndAuthorize(issueId, currentUser);
        return issueCommentRepository.findByIssueOrderByCreatedAtAsc(issue)
                .stream()
                .map(IssueCommentResponse::from)
                .toList();
    }

    @Transactional
    public IssueCommentResponse create(Long issueId, CreateIssueCommentRequest request, User currentUser) {
        Issue issue = findAndAuthorize(issueId, currentUser);

        IssueComment comment = issueCommentRepository.save(IssueComment.builder()
                .issue(issue)
                .author(currentUser)
                .content(request.getContent().trim())
                .build());

        notificationService.createCommentNotification(issue, currentUser);

        return IssueCommentResponse.from(comment);
    }

    private Issue findAndAuthorize(Long issueId, User currentUser) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found."));

        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isOwner = issue.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this issue.");

        return issue;
    }
}