package edu.cit.azcuna.fixpoint.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSettingsRequest {
    @NotNull(message = "Email notification preference is required.")
    private Boolean emailNotificationsEnabled;

    @NotNull(message = "System announcement preference is required.")
    private Boolean systemAnnouncementsEnabled;
}
