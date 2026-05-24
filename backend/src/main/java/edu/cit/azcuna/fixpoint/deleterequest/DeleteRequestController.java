package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.DeleteRequestResponse;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.service.DeleteRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class DeleteRequestController {

    private final DeleteRequestService deleteRequestService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Changed URL from "delete-request" to "request-deletion" to avoid "delete" keyword
    @PostMapping("/api/v1/issues/{issueId}/request-deletion")
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable Long issueId,
            @RequestParam String reason
    ) {
        System.out.println("=== DELETE REQUEST CONTROLLER HIT ===");
        System.out.println("Issue ID: " + issueId);
        System.out.println("Reason: " + reason);
        
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(error("Reason is required."));
        }

        DeleteRequestResponse data = deleteRequestService.submit(issueId, reason, getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(success(data));
    }

    @GetMapping("/api/v1/issues/{issueId}/request-deletion")
    public ResponseEntity<Map<String, Object>> getPending(@PathVariable Long issueId) {
        Optional<DeleteRequestResponse> data = deleteRequestService.getPendingForIssue(issueId, getCurrentUser());
        return ResponseEntity.ok(success(data.orElse(null)));
    }

    @PutMapping("/api/v1/requests/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(@PathVariable Long id) {
        deleteRequestService.approve(id, getCurrentUser());
        return ResponseEntity.ok(success("Issue deleted successfully."));
    }

    @PutMapping("/api/v1/requests/{id}/decline")
    public ResponseEntity<Map<String, Object>> decline(@PathVariable Long id) {
        deleteRequestService.decline(id, getCurrentUser());
        return ResponseEntity.ok(success("Delete request declined."));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", true);
        r.put("data", data);
        r.put("error", null);
        r.put("timestamp", Instant.now().toString());
        return r;
    }

    private Map<String, Object> error(String message) {
        Map<String, Object> r = new HashMap<>();
        r.put("success", false);
        r.put("data", null);
        r.put("error", Map.of("message", message));
        r.put("timestamp", Instant.now().toString());
        return r;
    }
}