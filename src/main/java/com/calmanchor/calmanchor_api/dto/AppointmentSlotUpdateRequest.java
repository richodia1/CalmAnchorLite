package com.calmanchor.calmanchor_api.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentSlotUpdateRequest(
        @NotBlank String appointmentDate,
        @NotBlank String slotStart,
        @NotBlank String slotEnd
) {
}

