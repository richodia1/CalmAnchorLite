package com.calmanchor.calmanchor_api.dto;

public record ApiHealthResponse(
        String status,
        String dataMode,
        int patientCount,
        int appointmentCount,
        int scheduleSlotCount
) {
}

