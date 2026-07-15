package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.dto.AppointmentSlotUpdateRequest;
import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;

import java.util.List;
import java.util.Optional;

public interface ClinicDataService {

    String DOCTOR_ID = "doctor-001";
    String APPOINTMENT_DATE = "2026-08-01";

    String getDataMode();

    Doctor getDoctor();

    Doctor saveDoctor(Doctor doctor);

    List<Patient> getPatients();

    Optional<Patient> findPatient(String patientId);

    Patient savePatient(Patient patient);

    void deletePatient(String patientId);

    List<Appointment> getAppointments();

    Optional<Appointment> findAppointment(String appointmentId);

    Appointment saveAppointment(Appointment appointment);

    Appointment moveAppointment(String appointmentId, AppointmentSlotUpdateRequest request);

    void deleteAppointment(String appointmentId);

    DayScheduleResponse getDaySchedule(String appointmentDate);

    List<ScheduleSlot> getAvailableSlots(String appointmentDate, String currentAppointmentId);

    void seedBaselineData();
}

