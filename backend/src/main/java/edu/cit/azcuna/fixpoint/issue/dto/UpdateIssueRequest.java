package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.Issue;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UpdateIssueRequest {

    // Users can update description; Admins can also update status
    private String description;
    private Issue.Status status;
}
