package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.AuthResponse;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    public AuthResponse loginWithGoogle(String idToken) {
        try {
            Map<String, Object> tokenInfo = verifyGoogleToken(idToken);
            if (tokenInfo == null) {
                return AuthResponse.error("AUTH-004", "Invalid Google token", "Token verification failed");
            }

            String aud = (String) tokenInfo.get("aud");
            if (!googleClientId.equals(aud)) {
                return AuthResponse.error("AUTH-004", "Invalid Google token", "Token audience mismatch");
            }

            String email    = (String) tokenInfo.get("email");
            String firstname = (String) tokenInfo.getOrDefault("given_name", "User");
            String lastname  = (String) tokenInfo.getOrDefault("family_name", "");
            String googleId  = (String) tokenInfo.get("sub");

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

            String accessToken  = jwtUtil.generateToken(user.getEmail());
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

            return AuthResponse.success(AuthResponse.TokenData.builder()
                    .user(AuthResponse.UserData.builder()
                            .id(user.getId())
                            .email(user.getEmail())
                            .firstname(user.getFirstname())
                            .lastname(user.getLastname())
                            .role(user.getRole().name())
                            .build())
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .build());

        } catch (Exception e) {
            log.error("Google OAuth error: {}", e.getMessage());
            return AuthResponse.error("AUTH-004", "Google login failed", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Token verification failed: {}", e.getMessage());
            return null;
        }
    }
}