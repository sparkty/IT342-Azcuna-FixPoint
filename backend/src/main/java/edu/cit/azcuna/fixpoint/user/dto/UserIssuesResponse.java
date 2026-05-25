package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter @Builder
public class UserIssuesResponse {

    private Long id;
    private String email;
    private String firstname;
    private String lastname;
    private String role;
    private Boolean isActive;
    private Integer issueCount;
    private List<IssueResponse> issues;

    public static UserIssuesResponse from(User user, List<IssueResponse> issues) {
        return UserIssuesResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .role(user.getRole().name())
                .isActive(user.getIsActive())
                .issueCount(issues.size())
                .issues(issues)
                .build();
    }
}
