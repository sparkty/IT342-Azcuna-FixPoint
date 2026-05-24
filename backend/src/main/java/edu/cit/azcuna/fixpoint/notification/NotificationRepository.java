package edu.cit.azcuna.fixpoint.repository;

import edu.cit.azcuna.fixpoint.entity.Notification;
import edu.cit.azcuna.fixpoint.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // All notifications for a user, newest first
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Count unread
    long countByUserAndIsRead(User user, Boolean isRead);

    // Mark all unread as read for a user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    void markAllAsReadForUser(User user);
    @Modifying
    @Transactional
    void deleteByUserIdAndIsReadTrue(Long userId);
}
