package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.dto.NotificationResponse;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.Notification;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.NotificationRepository;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ── Status update (existing) ───────────────────────────────────────────────
    public void createStatusUpdateNotification(Issue issue, Issue.Status oldStatus, Issue.Status newStatus) {
        String message = String.format(
                "Your issue #%d \"%s\" status changed from %s → %s.",
                issue.getId(), issue.getTitle(),
                oldStatus.name().replace("_", " "),
                newStatus.name().replace("_", " ")
        );
        save(issue.getUser(), issue, Notification.Type.STATUS_UPDATE, message);
    }

    // ── Welcome (existing) ────────────────────────────────────────────────────
    public void createWelcomeNotification(User user) {
        save(user, null, Notification.Type.SYSTEM,
                "Welcome to FixPoint, " + user.getFirstname() + "! You can start reporting issues right away.");
    }

    // ── Delete request — notify ALL admins ────────────────────────────────────
    public void createDeleteRequestNotification(Issue issue, User requestedBy, String reason) {
        String message = String.format(
                "%s %s requested deletion of issue #%d \"%s\". Reason: %s",
                requestedBy.getFirstname(), requestedBy.getLastname(),
                issue.getId(), issue.getTitle(), reason
        );
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            save(admin, issue, Notification.Type.DELETE_REQUEST, message);
        }
    }

    // ── Delete approved — notify issue owner ──────────────────────────────────
    public void createDeleteApprovedNotification(User issueOwner, Issue issue) {
        String message = String.format(
                "Your deletion request for issue #%d \"%s\" was approved. The issue has been deleted.",
                issue.getId(), issue.getTitle()
        );
        save(issueOwner, null, Notification.Type.DELETE_APPROVED, message);
    }

    // ── Delete declined — notify issue owner ──────────────────────────────────
    public void createDeleteDeclinedNotification(User issueOwner, Issue issue) {
        String message = String.format(
                "Your deletion request for issue #%d \"%s\" was declined by an admin.",
                issue.getId(), issue.getTitle()
        );
        save(issueOwner, issue, Notification.Type.DELETE_DECLINED, message);
    }

    // ── Get all for user ──────────────────────────────────────────────────────
    public List<NotificationResponse> getForUser(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(NotificationResponse::from).collect(Collectors.toList());
    }

    // ── Mark single as read ───────────────────────────────────────────────────
    public NotificationResponse markAsRead(Long id, User currentUser) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!notification.getUser().getId().equals(currentUser.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        notification.setIsRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    // ── Mark all as read ──────────────────────────────────────────────────────
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user);
    }

    // ── Internal helper ───────────────────────────────────────────────────────
    private void save(User user, Issue issue, Notification.Type type, String message) {
        notificationRepository.save(Notification.builder()
                .user(user).issue(issue).type(type).message(message).isRead(false)
                .build());
    }
}
