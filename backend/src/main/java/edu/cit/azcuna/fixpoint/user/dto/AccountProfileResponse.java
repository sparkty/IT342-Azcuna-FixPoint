package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.AccountDeletionRequest;
import edu.cit.azcuna.fixpoint.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AccountProfileResponse {
    private Long id;
    private String email;
    private String firstname;
    private String lastname;
    private String fullName;
    private String role;
    private String bio;
    private String profilePictureUrl;
    private String oauthProvider;
    private Boolean googleLinked;
    private Boolean emailNotificationsEnabled;
    private Boolean systemAnnouncementsEnabled;
    private DeletionRequestInfo deletionRequest;

    @Getter
    @Builder
    public static class DeletionRequestInfo {
        private Long id;
        private String status;
        private String reason;

        public static DeletionRequestInfo from(AccountDeletionRequest request) {
            if (request == null) return null;

            return DeletionRequestInfo.builder()
                    .id(request.getId())
                    .status(request.getStatus().name())
                    .reason(request.getReason())
                    .build();
        }
    }

    public static AccountProfileResponse from(User user, AccountDeletionRequest deletionRequest) {
        String fullName = (user.getFirstname() + " " + user.getLastname()).trim();
        String profilePictureUrl = user.getProfilePictureFilename() == null
                ? null
                : "/files/" + user.getProfilePictureFilename();

        return AccountProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .fullName(fullName)
                .role(user.getRole().name())
                .bio(user.getBio())
                .profilePictureUrl(profilePictureUrl)
                .oauthProvider(user.getOauthProvider())
                .googleLinked("GOOGLE".equals(user.getOauthProvider()) && user.getOauthId() != null)
                .emailNotificationsEnabled(user.getEmailNotificationsEnabled() == null || user.getEmailNotificationsEnabled())
                .systemAnnouncementsEnabled(user.getSystemAnnouncementsEnabled() == null || user.getSystemAnnouncementsEnabled())
                .deletionRequest(DeletionRequestInfo.from(deletionRequest))
                .build();
    }
}
