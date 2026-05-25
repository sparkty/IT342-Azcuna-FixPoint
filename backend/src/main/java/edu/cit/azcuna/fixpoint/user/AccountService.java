package edu.cit.azcuna.fixpoint.service;

import edu.cit.azcuna.fixpoint.auth.GoogleOAuthService;
import edu.cit.azcuna.fixpoint.dto.*;
import edu.cit.azcuna.fixpoint.entity.AccountDeletionRequest;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final DeleteRequestRepository deleteRequestRepository;
    private final AccountDeletionRequestRepository accountDeletionRequestRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleOAuthService googleOAuthService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public AccountProfileResponse getProfile(User currentUser) {
        AccountDeletionRequest pendingRequest = accountDeletionRequestRepository
                .findByRequestedUserAndStatus(currentUser, AccountDeletionRequest.Status.PENDING)
                .orElse(null);

        return AccountProfileResponse.from(currentUser, pendingRequest);
    }

    @Transactional
    public AccountProfileResponse updateProfile(UpdateProfileRequest request, User currentUser) {
        currentUser.setBio(request.getBio() == null ? null : request.getBio().trim());

        if (request.getRole() != null && request.getRole() != currentUser.getRole()) {
            if (currentUser.getRole() != User.Role.ADMIN) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can change roles.");
            }

            if (currentUser.getRole() == User.Role.ADMIN && request.getRole() != User.Role.ADMIN) {
                long activeAdmins = userRepository.findByRole(User.Role.ADMIN).stream()
                        .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                        .count();
                if (activeAdmins <= 1) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one active admin is required.");
                }
            }

            currentUser.setRole(request.getRole());
        }

        User saved = userRepository.save(currentUser);
        return getProfile(saved);
    }

    @Transactional
    public AccountProfileResponse updateProfilePicture(MultipartFile file, User currentUser) {
        try {
            String previousFilename = currentUser.getProfilePictureFilename();
            String storedName = fileStorageService.storeImage(file);
            currentUser.setProfilePictureFilename(storedName);
            currentUser.setProfilePictureOriginalName(file.getOriginalFilename());
            User saved = userRepository.save(currentUser);

            if (previousFilename != null) {
                fileStorageService.delete(previousFilename);
            }

            return getProfile(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store profile picture.");
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different.");
        }

        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    @Transactional
    public AccountProfileResponse updateSettings(UpdateSettingsRequest request, User currentUser) {
        currentUser.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        currentUser.setSystemAnnouncementsEnabled(request.getSystemAnnouncementsEnabled());
        User saved = userRepository.save(currentUser);
        return getProfile(saved);
    }

    @Transactional
    public AccountProfileResponse linkGoogle(String accessToken, User currentUser) {
        Map<String, Object> tokenInfo = googleOAuthService.verifyGoogleToken(accessToken);
        if (tokenInfo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Google token.");
        }

        String googleEmail = (String) tokenInfo.get("email");
        String googleId = (String) tokenInfo.get("sub");
        if (googleEmail == null || googleId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google account details are incomplete.");
        }

        if (!currentUser.getEmail().equalsIgnoreCase(googleEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google email must match your FixPoint email.");
        }

        userRepository.findAll().stream()
                .filter(user -> googleId.equals(user.getOauthId()) && !user.getId().equals(currentUser.getId()))
                .findFirst()
                .ifPresent(user -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "This Google account is already linked.");
                });

        currentUser.setOauthProvider("GOOGLE");
        currentUser.setOauthId(googleId);
        User saved = userRepository.save(currentUser);
        return getProfile(saved);
    }

    @Transactional
    public AccountProfileResponse unlinkGoogle(User currentUser) {
        if (!"GOOGLE".equals(currentUser.getOauthProvider())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Google account is linked.");
        }

        currentUser.setOauthProvider(null);
        currentUser.setOauthId(null);
        User saved = userRepository.save(currentUser);
        return getProfile(saved);
    }

    @Transactional
    public AccountProfileResponse submitDeletionRequest(AccountDeletionRequestDto request, User currentUser) {
        if (accountDeletionRequestRepository.existsByRequestedUserAndStatus(
                currentUser,
                AccountDeletionRequest.Status.PENDING
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account deletion request is already pending.");
        }

        accountDeletionRequestRepository.save(AccountDeletionRequest.builder()
                .requestedUser(currentUser)
                .reason(request.getReason().trim())
                .status(AccountDeletionRequest.Status.PENDING)
                .build());
        notificationService.createAccountDeleteRequestNotification(currentUser, request.getReason().trim());

        return getProfile(currentUser);
    }

    @Transactional(readOnly = true)
    public List<AccountDeletionReviewResponse> getPendingDeletionRequests(User admin) {
        ensureAdmin(admin);
        return accountDeletionRequestRepository
                .findByStatusOrderByCreatedAtDesc(AccountDeletionRequest.Status.PENDING)
                .stream()
                .map(AccountDeletionReviewResponse::from)
                .toList();
    }

    @Transactional
    public void approveDeletionRequest(Long requestId, User admin) {
        ensureAdmin(admin);
        AccountDeletionRequest request = findPendingDeletionRequest(requestId);
        User requestedUser = request.getRequestedUser();

        if (requestedUser.getRole() == User.Role.ADMIN) {
            long activeAdmins = userRepository.findByRole(User.Role.ADMIN).stream()
                    .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                    .count();
            if (activeAdmins <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete the only active admin.");
            }
        }

        request.setStatus(AccountDeletionRequest.Status.APPROVED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        accountDeletionRequestRepository.save(request);

        deleteUserAccount(requestedUser);
    }

    @Transactional
    public void declineDeletionRequest(Long requestId, User admin) {
        ensureAdmin(admin);
        AccountDeletionRequest request = findPendingDeletionRequest(requestId);
        request.setStatus(AccountDeletionRequest.Status.DECLINED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        accountDeletionRequestRepository.save(request);
    }

    private AccountDeletionRequest findPendingDeletionRequest(Long requestId) {
        AccountDeletionRequest request = accountDeletionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account deletion request not found."));

        if (request.getStatus() != AccountDeletionRequest.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This request has already been reviewed.");
        }

        return request;
    }

    private void deleteUserAccount(User user) {
        List<Issue> issues = issueRepository.findByUserOrderByIdAsc(user);
        for (Issue issue : issues) {
            if (issue.getAttachmentFilename() != null) {
                fileStorageService.delete(issue.getAttachmentFilename());
            }
        }

        if (user.getProfilePictureFilename() != null) {
            fileStorageService.delete(user.getProfilePictureFilename());
        }

        notificationRepository.deleteByUser(user);
        notificationRepository.deleteByIssueOwner(user);
        deleteRequestRepository.deleteByRequesterOrIssueOwner(user);
        passwordResetTokenRepository.deleteByUser(user);
        issueRepository.deleteAll(issues);
        accountDeletionRequestRepository.deleteByRequestedUserOrReviewer(user);
        userRepository.delete(user);
    }

    private void ensureAdmin(User user) {
        if (user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admins can perform this action.");
        }
    }
}
