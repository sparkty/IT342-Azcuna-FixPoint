package edu.cit.azcuna.fixpoint.repository;

import com.fixpoint.entity.Issue;
import com.fixpoint.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    // Users see only their own issues
    Page<Issue> findByUser(User user, Pageable pageable);
    Page<Issue> findByUserAndStatus(User user, Issue.Status status, Pageable pageable);
    Page<Issue> findByUserAndCategory(User user, Issue.Category category, Pageable pageable);
    Page<Issue> findByUserAndStatusAndCategory(User user, Issue.Status status, Issue.Category category, Pageable pageable);

    // Admins see all issues
    Page<Issue> findByStatus(Issue.Status status, Pageable pageable);
    Page<Issue> findByCategory(Issue.Category category, Pageable pageable);
    Page<Issue> findByStatusAndCategory(Issue.Status status, Issue.Category category, Pageable pageable);
}
