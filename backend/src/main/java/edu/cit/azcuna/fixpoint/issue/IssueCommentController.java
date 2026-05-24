package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.CreateIssueCommentRequest;
import edu.cit.azcuna.fixpoint.dto.IssueCommentResponse;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.service.IssueCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/comments")
@RequiredArgsConstructor
public class IssueCommentController {

    private final IssueCommentService issueCommentService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@PathVariable Long issueId) {
        return ResponseEntity.ok(success(issueCommentService.list(issueId, getCurrentUser())));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @PathVariable Long issueId,
            @Valid @RequestBody CreateIssueCommentRequest request
    ) {
        IssueCommentResponse comment = issueCommentService.create(issueId, request, getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(success(comment));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data != null ? data : Map.of());
        response.put("error", null);
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}