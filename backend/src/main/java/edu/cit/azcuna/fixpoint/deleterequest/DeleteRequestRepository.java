package edu.cit.azcuna.fixpoint.repository;

import edu.cit.azcuna.fixpoint.entity.DeleteRequest;
import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface DeleteRequestRepository extends JpaRepository<DeleteRequest, Long> {

    // Check if a pending request already exists for an issue
    Optional<DeleteRequest> findByIssueAndStatus(Issue issue, DeleteRequest.Status status);

    // Check if any request exists for an issue (to prevent duplicates)
    boolean existsByIssueAndStatus(Issue issue, DeleteRequest.Status status);

    @Modifying
    @Transactional
    @Query("DELETE FROM DeleteRequest dr WHERE dr.requestedBy = :user OR dr.reviewedBy = :user OR dr.issue.user = :user")
    void deleteByRequesterOrIssueOwner(@Param("user") User user);
}
