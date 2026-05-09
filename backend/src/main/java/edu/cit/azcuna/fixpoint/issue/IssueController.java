package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.*;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> create(
            @ModelAttribute CreateIssueRequest request,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(success(issueService.create(request, attachment, currentUser)));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) edu.cit.azcuna.fixpoint.entity.Issue.Status status,
            @RequestParam(required = false) edu.cit.azcuna.fixpoint.entity.Issue.Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        User currentUser = getCurrentUser();

        Page<IssueResponse> result =
                issueService.list(status, category, page, size, currentUser);

        Map<String, Object> data = Map.of(
                "content", result.getContent(),
                "totalPages", result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "currentPage", result.getNumber()
        );
        
        return ResponseEntity.ok(success(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        IssueResponse issue = issueService.getById(id, currentUser);
        return ResponseEntity.ok(success(issue));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data != null ? data : Map.of());
        response.put("error", null);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody UpdateIssueRequest request
    ) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(success(issueService.update(id, request, currentUser)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        issueService.delete(id, currentUser);
        return ResponseEntity.ok(success("Issue deleted successfully."));
    }
}