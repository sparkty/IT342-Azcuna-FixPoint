package edu.cit.azcuna.fixpoint.controller;

import com.fixpoint.dto.CreateIssueRequest;
import com.fixpoint.dto.IssueResponse;
import com.fixpoint.dto.UpdateIssueRequest;
import com.fixpoint.entity.Issue;
import com.fixpoint.entity.User;
import com.fixpoint.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    // ── POST /api/v1/issues ────────────────────────────────────────────────────
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> create(
            @Valid @ModelAttribute CreateIssueRequest request,
            @RequestPart(value = "attachment", required = false) MultipartFile attachment,
            @AuthenticationPrincipal User currentUser
    ) {
        IssueResponse data = issueService.create(request, attachment, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(success(data));
    }

    // ── GET /api/v1/issues ─────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) Issue.Status status,
            @RequestParam(required = false) Issue.Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal User currentUser
    ) {
        Page<IssueResponse> result = issueService.list(status, category, page, size, currentUser);

        Map<String, Object> paged = Map.of(
                "content",       result.getContent(),
                "totalPages",    result.getTotalPages(),
                "totalElements", result.getTotalElements(),
                "currentPage",   result.getNumber()
        );
        return ResponseEntity.ok(success(paged));
    }

    // ── GET /api/v1/issues/{id} ────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(success(issueService.getById(id, currentUser)));
    }

    // ── PUT /api/v1/issues/{id} ────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody UpdateIssueRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(success(issueService.update(id, request, currentUser)));
    }

    // ── DELETE /api/v1/issues/{id} ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        issueService.delete(id, currentUser);
        return ResponseEntity.ok(Map.of(
                "success",   true,
                "data",      null,
                "error",     null,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private Map<String, Object> success(Object data) {
        return Map.of(
                "success",   true,
                "data",      data,
                "error",     null,
                "timestamp", Instant.now().toString()
        );
    }
}
