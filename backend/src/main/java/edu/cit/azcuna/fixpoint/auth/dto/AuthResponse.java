package edu.cit.azcuna.fixpoint.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private boolean success;
    private Object data;
    private ErrorInfo error;
    private String timestamp;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ErrorInfo {
        private String code;
        private String message;
        private Object details;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserData {
        private Long id;
        private String email;
        private String firstname;
        private String lastname;
        private String role;
        private String profilePictureUrl;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TokenData {
        private UserData user;
        private String accessToken;
        private String refreshToken;
    }

    public static AuthResponse success(Object data) {
        return AuthResponse.builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now().toString())
                .build();
    }

    public static AuthResponse error(String code, String message, Object details) {
        return AuthResponse.builder()
                .success(false)
                .data(null)
                .error(ErrorInfo.builder().code(code).message(message).details(details).build())
                .timestamp(LocalDateTime.now().toString())
                .build();
    }
}
