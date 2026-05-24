package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.Issue;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder
public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private Issue.Category category;
    private Issue.Status status;
    private Issue.Priority priority;
    private AttachmentInfo attachment;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String reporterName;
    private String reporterInitials;
    private List<IssueCommentResponse> comments;

    @Getter @Builder
    public static class AttachmentInfo {
        private String filename;
        private String url;
    }

    // ── Factory ────────────────────────────────────────────────────────────────
    public static IssueResponse from(Issue issue) {
        return from(issue, false);
    }

    public static IssueResponse from(Issue issue, boolean includeComments) {
        AttachmentInfo attachmentInfo = null;
        if (issue.getAttachmentFilename() != null) {
            attachmentInfo = AttachmentInfo.builder()
                    .filename(issue.getAttachmentOriginalName())
                    .url("/api/v1/files/" + issue.getAttachmentFilename())
                    .build();
        }

        List<IssueCommentResponse> commentData = null;
        if (includeComments && issue.getComments() != null) {
            commentData = issue.getComments().stream()
                    .map(IssueCommentResponse::from)
                    .toList();
        }

        return IssueResponse.builder()
            .id(issue.getId())
            .title(issue.getTitle())
            .description(issue.getDescription())
            .category(issue.getCategory())
            .status(issue.getStatus())
            .priority(issue.getPriority())
            .attachment(attachmentInfo)
            .userId(issue.getUser().getId())
            .reporterName(issue.getUser().getFirstname() + " " + issue.getUser().getLastname())
            .reporterInitials(
                String.valueOf(issue.getUser().getFirstname().charAt(0)).toUpperCase() +
                String.valueOf(issue.getUser().getLastname().charAt(0)).toUpperCase()
            )
            .createdAt(issue.getCreatedAt())
            .updatedAt(issue.getUpdatedAt())
            .comments(commentData)
            .build();
    }
}
