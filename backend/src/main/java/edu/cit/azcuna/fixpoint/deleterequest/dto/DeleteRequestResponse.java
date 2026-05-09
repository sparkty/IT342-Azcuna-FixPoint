package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.DeleteRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter @Builder
public class DeleteRequestResponse {

    private Long id;
    private Long issueId;
    private String issueTitle;
    private String requestedByName;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public static DeleteRequestResponse from(DeleteRequest dr) {
        return DeleteRequestResponse.builder()
                .id(dr.getId())
                .issueId(dr.getIssue().getId())
                .issueTitle(dr.getIssue().getTitle())
                .requestedByName(dr.getRequestedBy().getFirstname() + " " + dr.getRequestedBy().getLastname())
                .reason(dr.getReason())
                .status(dr.getStatus().name())
                .createdAt(dr.getCreatedAt())
                .reviewedAt(dr.getReviewedAt())
                .build();
    }
}
