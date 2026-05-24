package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.IssueComment;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class IssueCommentResponse {

    private Long id;
    private Long issueId;
    private Long authorId;
    private String authorName;
    private String authorInitials;
    private String authorRole;
    private String content;
    private LocalDateTime createdAt;

    public static IssueCommentResponse from(IssueComment comment) {
        String firstname = comment.getAuthor().getFirstname();
        String lastname = comment.getAuthor().getLastname();

        return IssueCommentResponse.builder()
                .id(comment.getId())
                .issueId(comment.getIssue().getId())
                .authorId(comment.getAuthor().getId())
                .authorName(firstname + " " + lastname)
                .authorInitials(
                        String.valueOf(firstname.charAt(0)).toUpperCase() +
                        String.valueOf(lastname.charAt(0)).toUpperCase()
                )
                .authorRole(comment.getAuthor().getRole().name())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}