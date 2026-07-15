package com.calmanchor.calmanchor_api.dto;

import com.calmanchor.calmanchor_api.model.Doctor;

import java.util.List;

public record DayScheduleResponse(
        Doctor doctor,
        String appointmentDate,
        List<ScheduleSlot> slots
) {
}

