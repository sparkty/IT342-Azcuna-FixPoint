package edu.cit.azcuna.fixpoint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountDeletionRequestDto {
    @NotBlank(message = "Reason is required.")
    @Size(max = 500, message = "Reason must be 500 characters or fewer.")
    private String reason;
}
