package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Patient;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;

class SeedDataServiceTests {

    private final SeedDataService seedDataService = new SeedDataService();

    @Test
    void seedDataContainsAssessmentBaselineRecords() {
        assertThat(seedDataService.getDoctor().getId()).isEqualTo(ClinicDataService.DOCTOR_ID);
        assertThat(seedDataService.getPatients()).hasSize(5);
        assertThat(seedDataService.getAppointments()).hasSize(5);
    }

    @Test
    void dayScheduleGeneratesTwentyFourSlots() {
        DayScheduleResponse schedule = seedDataService.getDaySchedule(ClinicDataService.APPOINTMENT_DATE);

        assertThat(schedule.slots()).hasSize(24);
        assertThat(schedule.slots().getFirst().start()).isEqualTo("09:00");
        assertThat(schedule.slots().getLast().end()).isEqualTo("17:00");
    }

    @Test
    void availableSlotsExcludeBookedSlots() {
        List<ScheduleSlot> availableSlots = seedDataService.getAvailableSlots(ClinicDataService.APPOINTMENT_DATE, null);

        assertThat(availableSlots).hasSize(19);
        assertThat(availableSlots).noneMatch(slot -> "09:00".equals(slot.start()));
    }

    @Test
    void availableSlotsIncludeCurrentAppointmentSlotWhenChangingAppointment() {
        List<ScheduleSlot> availableSlots = seedDataService.getAvailableSlots(
                ClinicDataService.APPOINTMENT_DATE,
                "appointment-001"
        );

        assertThat(availableSlots).hasSize(20);
        assertThat(availableSlots).anyMatch(slot -> "09:00".equals(slot.start()));
    }

    @Test
    void canCreateAndDeletePatient() {
        Patient patient = new Patient(null, null, "Test Patient");

        Patient savedPatient = seedDataService.savePatient(patient);

        assertThat(savedPatient.getId()).startsWith("patient-");
        assertThat(savedPatient.getDoctorId()).isEqualTo(ClinicDataService.DOCTOR_ID);
        assertThat(seedDataService.findPatient(savedPatient.getId())).isPresent();

        seedDataService.deletePatient(savedPatient.getId());

        assertThat(seedDataService.findPatient(savedPatient.getId())).isEmpty();
    }

    @Test
    void appointmentCannotUseAlreadyBookedSlot() {
        Appointment appointment = new Appointment(
                null,
                ClinicDataService.DOCTOR_ID,
                "patient-002",
                ClinicDataService.APPOINTMENT_DATE,
                "09:00",
                "09:20"
        );

        assertThatThrownBy(() -> seedDataService.saveAppointment(appointment))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Slot already booked");
    }
}
