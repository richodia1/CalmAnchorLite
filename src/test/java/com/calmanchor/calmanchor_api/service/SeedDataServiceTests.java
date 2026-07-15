package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SeedDataServiceTests {

    private final SeedDataService seedDataService = new SeedDataService();

    @Test
    void seedDataContainsAssessmentBaselineRecords() {
        assertThat(seedDataService.getDoctor().getId()).isEqualTo(SeedDataService.DOCTOR_ID);
        assertThat(seedDataService.getPatients()).hasSize(5);
        assertThat(seedDataService.getAppointments()).hasSize(5);
    }

    @Test
    void dayScheduleGeneratesTwentyFourSlots() {
        DayScheduleResponse schedule = seedDataService.getDaySchedule(SeedDataService.APPOINTMENT_DATE);

        assertThat(schedule.slots()).hasSize(24);
        assertThat(schedule.slots().getFirst().start()).isEqualTo("09:00");
        assertThat(schedule.slots().getLast().end()).isEqualTo("17:00");
    }

    @Test
    void availableSlotsExcludeBookedSlots() {
        List<ScheduleSlot> availableSlots = seedDataService.getAvailableSlots(SeedDataService.APPOINTMENT_DATE, null);

        assertThat(availableSlots).hasSize(19);
        assertThat(availableSlots).noneMatch(slot -> "09:00".equals(slot.start()));
    }

    @Test
    void availableSlotsIncludeCurrentAppointmentSlotWhenChangingAppointment() {
        List<ScheduleSlot> availableSlots = seedDataService.getAvailableSlots(
                SeedDataService.APPOINTMENT_DATE,
                "appointment-001"
        );

        assertThat(availableSlots).hasSize(20);
        assertThat(availableSlots).anyMatch(slot -> "09:00".equals(slot.start()));
    }
}

