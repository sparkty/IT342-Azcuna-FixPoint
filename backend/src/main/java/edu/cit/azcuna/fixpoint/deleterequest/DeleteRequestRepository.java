package edu.cit.azcuna.fixpoint.repository;

import edu.cit.azcuna.fixpoint.entity.DeleteRequest;
import edu.cit.azcuna.fixpoint.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeleteRequestRepository extends JpaRepository<DeleteRequest, Long> {

    // Check if a pending request already exists for an issue
    Optional<DeleteRequest> findByIssueAndStatus(Issue issue, DeleteRequest.Status status);

    // Check if any request exists for an issue (to prevent duplicates)
    boolean existsByIssueAndStatus(Issue issue, DeleteRequest.Status status);
}
