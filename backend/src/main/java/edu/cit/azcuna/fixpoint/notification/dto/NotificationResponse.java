package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class NotificationResponse {

    private Long id;
    private Long issueId;       // null for SYSTEM notifications
    private String type;        // "STATUS_UPDATE" | "COMMENT" | "SYSTEM"
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return from(n, n.getIssue() != null ? n.getIssue().getId() : null);
    }

    public static NotificationResponse from(Notification n, Long issueRouteId) {
        return NotificationResponse.builder()
                .id(n.getId())
                .issueId(issueRouteId)
                .type(n.getType().name())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
