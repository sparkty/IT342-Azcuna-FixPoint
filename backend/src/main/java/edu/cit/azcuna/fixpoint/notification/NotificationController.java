package edu.cit.azcuna.fixpoint.auth;

import edu.cit.azcuna.fixpoint.dto.NotificationResponse;
import edu.cit.azcuna.fixpoint.entity.User;
import edu.cit.azcuna.fixpoint.repository.UserRepository;
import edu.cit.azcuna.fixpoint.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // GET /api/v1/notifications
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        List<NotificationResponse> data = notificationService.getForUser(getCurrentUser());
        return ResponseEntity.ok(success(data));
    }

    // PUT /api/v1/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        NotificationResponse data = notificationService.markAsRead(id, getCurrentUser());
        return ResponseEntity.ok(success(data));
    }

    // PUT /api/v1/notifications/read-all
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUser());
        return ResponseEntity.ok(success("All notifications marked as read."));
    }

    @DeleteMapping("/read")
    public ResponseEntity<Map<String, Object>> deleteAllRead() {
        User user = getCurrentUser();

        notificationService.deleteAllReadNotifications(user.getId());

        return ResponseEntity.ok(success(null));
    }

    private Map<String, Object> success(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("error", null);
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}
