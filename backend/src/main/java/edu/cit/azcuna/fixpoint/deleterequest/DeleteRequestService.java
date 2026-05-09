package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.dto.DeleteRequestResponse;
import edu.cit.azcuna.fixpoint.entity.DeleteRequest;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.DeleteRequestRepository;
import edu.cit.azcuna.fixpoint.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeleteRequestService {

    private final DeleteRequestRepository deleteRequestRepository;
    private final IssueRepository issueRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    // ── User submits a delete request ─────────────────────────────────────────
    @Transactional 
    public DeleteRequestResponse submit(Long issueId, String reason, User currentUser) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found."));

        // Only the issue owner can request deletion
        if (!issue.getUser().getId().equals(currentUser.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only request deletion of your own issues.");

        // Prevent duplicate pending requests
        if (deleteRequestRepository.existsByIssueAndStatus(issue, DeleteRequest.Status.PENDING))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A deletion request for this issue is already pending.");

        DeleteRequest dr = DeleteRequest.builder()
                .issue(issue)
                .requestedBy(currentUser)
                .reason(reason)
                .status(DeleteRequest.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        DeleteRequest saved = deleteRequestRepository.save(dr);

        // Notify all admins
        notificationService.createDeleteRequestNotification(issue, currentUser, reason);

        return DeleteRequestResponse.from(saved);
    }

    // ── Admin approves — issue gets deleted ───────────────────────────────────
    @Transactional
    public void approve(Long deleteRequestId, User admin) {
        DeleteRequest dr = findAndAuthorizeAdmin(deleteRequestId, admin);

        Issue issue = dr.getIssue();
        User issueOwner = issue.getUser();

        // Delete attachment if exists
        if (issue.getAttachmentFilename() != null)
            fileStorageService.delete(issue.getAttachmentFilename());

        // Mark request reviewed
        dr.setStatus(DeleteRequest.Status.APPROVED);
        dr.setReviewedAt(LocalDateTime.now());
        deleteRequestRepository.save(dr);

        // Delete the issue
        issueRepository.delete(issue);

        // Notify the original owner
        notificationService.createDeleteApprovedNotification(issueOwner, issue);
    }

    // ── Admin declines ────────────────────────────────────────────────────────
    @Transactional
    public void decline(Long deleteRequestId, User admin) {
        DeleteRequest dr = findAndAuthorizeAdmin(deleteRequestId, admin);

        Issue issue = dr.getIssue();

        dr.setStatus(DeleteRequest.Status.DECLINED);
        dr.setReviewedAt(LocalDateTime.now());
        deleteRequestRepository.save(dr);

        // Notify the original owner
        notificationService.createDeleteDeclinedNotification(issue.getUser(), issue);
    }

    // ── Get pending request for an issue (so frontend can show the panel) ────
    public Optional<DeleteRequestResponse> getPendingForIssue(Long issueId) {
        return issueRepository.findById(issueId)
                .flatMap(issue -> deleteRequestRepository.findByIssueAndStatus(issue, DeleteRequest.Status.PENDING))
                .map(DeleteRequestResponse::from);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private DeleteRequest findAndAuthorizeAdmin(Long id, User admin) {
        if (admin.getRole() != User.Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can review delete requests.");

        DeleteRequest dr = deleteRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delete request not found."));

        if (dr.getStatus() != DeleteRequest.Status.PENDING)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request has already been reviewed.");

        return dr;
    }
}