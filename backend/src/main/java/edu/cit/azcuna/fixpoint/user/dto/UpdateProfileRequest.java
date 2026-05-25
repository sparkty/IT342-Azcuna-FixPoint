package edu.cit.azcuna.fixpoint.dto;

import edu.cit.azcuna.fixpoint.entity.User;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    @Size(max = 500, message = "Bio must be 500 characters or fewer.")
    private String bio;

    private User.Role role;
}
