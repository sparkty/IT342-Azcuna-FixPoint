package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.dto.*;
import edu.cit.azcuna.fixpoint.entity.PasswordResetToken;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.PasswordResetTokenRepository;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import edu.cit.azcuna.fixpoint.email.EmailService;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.error("DB-002", "Email already registered", null);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstname(request.getFirstname())
                .lastname(request.getLastname())
                .role(User.Role.USER)
                .isActive(true)
                .build();

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstname());

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.success(AuthResponse.TokenData.builder()
                .user(toUserData(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build());
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return AuthResponse.error("AUTH-001", "Invalid credentials", "Email or password is incorrect");
        }

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return AuthResponse.success(AuthResponse.TokenData.builder()
                .user(toUserData(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build());
    }

    public AuthResponse refresh(RefreshRequest request) {
        try {
            String email = jwtUtil.extractEmail(request.getRefreshToken());
            String newAccessToken = jwtUtil.generateToken(email);
            return AuthResponse.success(AuthResponse.TokenData.builder()
                    .accessToken(newAccessToken)
                    .build());
        } catch (Exception e) {
            return AuthResponse.error("AUTH-002", "Token expired", "Refresh token is invalid or expired");
        }
    }

    public AuthResponse getCurrentUser(String token) {
        try {
            String email = jwtUtil.extractEmail(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return AuthResponse.success(AuthResponse.TokenData.builder()
                    .user(toUserData(user))
                    .build());
        } catch (Exception e) {
            return AuthResponse.error("AUTH-002", "Token expired or invalid", e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .token(UUID.randomUUID().toString())
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();

            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstname(), resetToken.getToken());
        });

        return AuthResponse.success("If an account exists for that email, a password reset link has been sent.");
    }

    public AuthResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElse(null);

        if (resetToken == null || resetToken.getUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return AuthResponse.error("AUTH-003", "Reset link is invalid or expired", null);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return AuthResponse.success("Password reset successfully. You can now sign in.");
    }

    private AuthResponse.UserData toUserData(User user) {
        return AuthResponse.UserData.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .role(user.getRole().name())
                .profilePictureUrl(user.getProfilePictureFilename() == null ? null : "/api/v1/files/" + user.getProfilePictureFilename())
                .build();
    }
}
