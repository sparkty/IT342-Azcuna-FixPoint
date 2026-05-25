package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.AuthResponse;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthResponse loginWithGoogle(String accessToken) {
        try {
            Map<String, Object> tokenInfo = verifyGoogleToken(accessToken);

            if (tokenInfo == null) {
                return AuthResponse.error(
                        "AUTH-004",
                        "Invalid Google token",
                        "Token verification failed"
                );
            }

            // aud check removed — /userinfo endpoint does not return aud field

            String email = (String) tokenInfo.get("email");
            String firstname = (String) tokenInfo.getOrDefault("given_name", "User");
            String lastname = (String) tokenInfo.getOrDefault("family_name", "");
            String googleId = (String) tokenInfo.get("sub");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .email(email)
                        .firstname(firstname)
                        .lastname(lastname)
                        .passwordHash(UUID.randomUUID().toString())
                        .oauthProvider("GOOGLE")
                        .oauthId(googleId)
                        .role(User.Role.USER)
                        .isActive(true)
                        .build();
                return userRepository.save(newUser);
            });

            String newAccessToken = jwtUtil.generateToken(user.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

            return AuthResponse.success(AuthResponse.TokenData.builder()
                    .user(AuthResponse.UserData.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .firstname(user.getFirstname())
                            .lastname(user.getLastname())
                            .role(user.getRole().name())
                            .build())
                    .accessToken(newAccessToken)
                    .refreshToken(refreshToken)
                    .build());

        } catch (Exception e) {
            log.error("Google OAuth error: {}", e.getMessage());
            return AuthResponse.error("AUTH-004", "Google login failed", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleToken(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET, entity, Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Token verification failed: {}", e.getMessage());
            return null;
        }
    }
}