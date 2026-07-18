package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.exception.ApiException;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

public final class ScheduleRules {

    private ScheduleRules() {
    }

    public static void validateDoctor(Doctor doctor) {
        requirePresent(doctor, "Doctor is required");
        requireText(doctor.getId(), "Doctor id is required");
        requireText(doctor.getFullName(), "Doctor full name is required");
        requireText(doctor.getWorkingDayStart(), "Doctor working day start is required");
        requireText(doctor.getWorkingDayEnd(), "Doctor working day end is required");

        LocalTime workingDayStart = parseTime(doctor.getWorkingDayStart(), "Doctor working day start must use HH:mm format");
        LocalTime workingDayEnd = parseTime(doctor.getWorkingDayEnd(), "Doctor working day end must use HH:mm format");

        if (!workingDayStart.isBefore(workingDayEnd)) {
            throw ApiException.badRequest("Doctor working day start must be before working day end");
        }
        if (doctor.getSlotLengthMinutes() <= 0) {
            throw ApiException.badRequest("Doctor slot length must be greater than zero");
        }
        if (Duration.between(workingDayStart, workingDayEnd).toMinutes() % doctor.getSlotLengthMinutes() != 0) {
            throw ApiException.badRequest("Doctor working day must divide evenly into appointment slots");
        }
    }

    public static void validatePatient(Patient patient) {
        requirePresent(patient, "Patient is required");
        requireText(patient.getId(), "Patient id is required");
        requireText(patient.getDoctorId(), "Patient doctorId is required");
        requireText(patient.getFullName(), "Patient full name is required");
    }

    public static void validateAppointment(Doctor doctor, Appointment appointment) {
        validateDoctor(doctor);
        requirePresent(appointment, "Appointment is required");
        requireText(appointment.getId(), "Appointment id is required");
        requireText(appointment.getDoctorId(), "Appointment doctorId is required");
        requireText(appointment.getPatientId(), "Appointment patientId is required");
        requireText(appointment.getAppointmentDate(), "Appointment date is required");
        requireText(appointment.getSlotStart(), "Appointment slotStart is required");
        requireText(appointment.getSlotEnd(), "Appointment slotEnd is required");

        if (!doctor.getId().equals(appointment.getDoctorId())) {
            throw ApiException.badRequest("Appointment doctorId must match the active doctor");
        }

        parseDate(appointment.getAppointmentDate());

        LocalTime workingDayStart = parseTime(doctor.getWorkingDayStart(), "Doctor working day start must use HH:mm format");
        LocalTime workingDayEnd = parseTime(doctor.getWorkingDayEnd(), "Doctor working day end must use HH:mm format");
        LocalTime slotStart = parseTime(appointment.getSlotStart(), "Appointment slotStart must use HH:mm format");
        LocalTime slotEnd = parseTime(appointment.getSlotEnd(), "Appointment slotEnd must use HH:mm format");
        LocalTime expectedSlotEnd = slotStart.plusMinutes(doctor.getSlotLengthMinutes());

        if (!slotEnd.equals(expectedSlotEnd)) {
            throw ApiException.badRequest("Appointment slotEnd must be exactly one slot length after slotStart");
        }
        if (slotStart.isBefore(workingDayStart) || slotEnd.isAfter(workingDayEnd)) {
            throw ApiException.badRequest("Appointment slot must be inside the doctor's working day");
        }

        long minutesFromStart = Duration.between(workingDayStart, slotStart).toMinutes();
        if (minutesFromStart % doctor.getSlotLengthMinutes() != 0) {
            throw ApiException.badRequest("Appointment slotStart must align to the doctor's slot length");
        }
    }

    private static void requirePresent(Object value, String message) {
        if (value == null) {
            throw ApiException.badRequest(message);
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw ApiException.badRequest(message);
        }
    }

    private static LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw ApiException.badRequest("Appointment date must use ISO date format yyyy-MM-dd");
        }
    }

    private static LocalTime parseTime(String value, String message) {
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException exception) {
            throw ApiException.badRequest(message);
        }
    }
}

