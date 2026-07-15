package com.calmanchor.calmanchor_api.dto;

import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Patient;

public record ScheduleSlot(
        String start,
        String end,
        boolean available,
        Appointment appointment,
        Patient patient
) {
}

