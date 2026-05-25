package edu.cit.azcuna.fixpoint.repository;

import edu.cit.azcuna.fixpoint.entity.AccountDeletionRequest;
import edu.cit.azcuna.fixpoint.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AccountDeletionRequestRepository extends JpaRepository<AccountDeletionRequest, Long> {
    Optional<AccountDeletionRequest> findByRequestedUserAndStatus(
            User requestedUser,
            AccountDeletionRequest.Status status
    );

    boolean existsByRequestedUserAndStatus(User requestedUser, AccountDeletionRequest.Status status);

    List<AccountDeletionRequest> findByStatusOrderByCreatedAtDesc(AccountDeletionRequest.Status status);

    @Modifying
    @Transactional
    @Query("DELETE FROM AccountDeletionRequest adr WHERE adr.requestedUser = :user OR adr.reviewedBy = :user")
    void deleteByRequestedUserOrReviewer(@Param("user") User user);
}
