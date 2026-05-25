package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.AccountDeletionRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AccountDeletionReviewResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String email;
    private String reason;
    private String status;
    private LocalDateTime createdAt;

    public static AccountDeletionReviewResponse from(AccountDeletionRequest request) {
        String fullName = (
                request.getRequestedUser().getFirstname() + " " +
                request.getRequestedUser().getLastname()
        ).trim();

        return AccountDeletionReviewResponse.builder()
                .id(request.getId())
                .userId(request.getRequestedUser().getId())
                .userName(fullName)
                .email(request.getRequestedUser().getEmail())
                .reason(request.getReason())
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
