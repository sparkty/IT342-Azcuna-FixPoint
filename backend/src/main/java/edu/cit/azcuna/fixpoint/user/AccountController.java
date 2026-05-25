package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.*;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        return ResponseEntity.ok(success(accountService.getProfile(getCurrentUser())));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(success(accountService.updateProfile(request, getCurrentUser())));
    }

    @PostMapping(value = "/profile-picture", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> updateProfilePicture(
            @RequestPart("profilePicture") MultipartFile profilePicture
    ) {
        return ResponseEntity.ok(success(accountService.updateProfilePicture(profilePicture, getCurrentUser())));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, Object>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(request, getCurrentUser());
        return ResponseEntity.ok(success("Password changed successfully."));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(success(accountService.getProfile(getCurrentUser())));
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@Valid @RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(success(accountService.updateSettings(request, getCurrentUser())));
    }

    @PostMapping("/google/link")
    public ResponseEntity<Map<String, Object>> linkGoogle(@RequestBody Map<String, String> request) {
        String accessToken = request.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body(error("Google access token is required."));
        }

        return ResponseEntity.ok(success(accountService.linkGoogle(accessToken, getCurrentUser())));
    }

    @DeleteMapping("/google/unlink")
    public ResponseEntity<Map<String, Object>> unlinkGoogle() {
        return ResponseEntity.ok(success(accountService.unlinkGoogle(getCurrentUser())));
    }

    @PostMapping("/deletion-request")
    public ResponseEntity<Map<String, Object>> requestAccountDeletion(
            @Valid @RequestBody AccountDeletionRequestDto request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(success(accountService.submitDeletionRequest(request, getCurrentUser())));
    }

    @GetMapping("/deletion-requests")
    public ResponseEntity<Map<String, Object>> getDeletionRequests() {
        return ResponseEntity.ok(success(accountService.getPendingDeletionRequests(getCurrentUser())));
    }

    @PutMapping("/deletion-requests/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveDeletionRequest(@PathVariable Long id) {
        accountService.approveDeletionRequest(id, getCurrentUser());
        return ResponseEntity.ok(success("Account deleted successfully."));
    }

    @PutMapping("/deletion-requests/{id}/decline")
    public ResponseEntity<Map<String, Object>> declineDeletionRequest(@PathVariable Long id) {
        accountService.declineDeletionRequest(id, getCurrentUser());
        return ResponseEntity.ok(success("Account deletion request declined."));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data != null ? data : Map.of());
        response.put("error", null);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("data", null);
        response.put("error", Map.of("message", message));
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}
