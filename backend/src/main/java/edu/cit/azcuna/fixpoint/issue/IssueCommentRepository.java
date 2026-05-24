package edu.cit.azcuna.fixpoint.repository;

import edu.cit.azcuna.fixpoint.entity.Issue;
import edu.cit.azcuna.fixpoint.entity.IssueComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueCommentRepository extends JpaRepository<IssueComment, Long> {

    List<IssueComment> findByIssueOrderByCreatedAtAsc(Issue issue);
}