package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.AppointmentSlotUpdateRequest;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.exception.ApiException;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.AppointmentStatus;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@ConditionalOnProperty(prefix = "firebase", name = "enabled", havingValue = "false", matchIfMissing = true)
public class SeedDataService implements ClinicDataService {

    private Doctor doctor;
    private final Map<String, Patient> patients = new LinkedHashMap<>();
    private final Map<String, Appointment> appointments = new LinkedHashMap<>();

    public SeedDataService() {
        seedBaselineData();
    }

    @Override
    public String getDataMode() {
        return "seed";
    }

    @Override
    public Doctor getDoctor() {
        return doctor;
    }

    @Override
    public Doctor saveDoctor(Doctor doctor) {
        if (isBlank(doctor.getId())) {
            doctor.setId(DOCTOR_ID);
        }
        ScheduleRules.validateDoctor(doctor);
        this.doctor = doctor;
        return this.doctor;
    }

    @Override
    public List<Patient> getPatients() {
        return List.copyOf(patients.values());
    }

    @Override
    public Optional<Patient> findPatient(String patientId) {
        return Optional.ofNullable(patients.get(patientId));
    }

    @Override
    public Patient savePatient(Patient patient) {
        if (isBlank(patient.getId())) {
            patient.setId("patient-" + UUID.randomUUID());
        }
        if (isBlank(patient.getDoctorId())) {
            patient.setDoctorId(DOCTOR_ID);
        }
        ScheduleRules.validatePatient(patient);

        patients.put(patient.getId(), patient);
        return patient;
    }

    @Override
    public void deletePatient(String patientId) {
        if (patients.remove(patientId) == null) {
            throw ApiException.notFound("Patient not found: " + patientId);
        }
        appointments.values().removeIf(appointment -> appointment.getPatientId().equals(patientId));
    }

    @Override
    public List<Appointment> getAppointments() {
        return appointments.values().stream()
                .sorted(Comparator.comparing(Appointment::getSlotStart))
                .toList();
    }

    @Override
    public Optional<Appointment> findAppointment(String appointmentId) {
        return Optional.ofNullable(appointments.get(appointmentId));
    }

    @Override
    public Appointment saveAppointment(Appointment appointment) {
        if (isBlank(appointment.getId())) {
            appointment.setId("appointment-" + UUID.randomUUID());
        }
        if (isBlank(appointment.getDoctorId())) {
            appointment.setDoctorId(DOCTOR_ID);
        }
        ensurePatientExists(appointment.getPatientId());
        ScheduleRules.validateAppointment(doctor, appointment);
        ensureSlotIsAvailable(appointment);

        appointments.put(appointment.getId(), appointment);
        return appointment;
    }

    @Override
    public Appointment moveAppointment(String appointmentId, AppointmentSlotUpdateRequest request) {
        Appointment appointment = findAppointment(appointmentId)
                .orElseThrow(() -> ApiException.notFound("Appointment not found: " + appointmentId));

        Appointment updatedAppointment = copyAppointment(appointment);
        updatedAppointment.setAppointmentDate(request.appointmentDate());
        updatedAppointment.setSlotStart(request.slotStart());
        updatedAppointment.setSlotEnd(request.slotEnd());
        ScheduleRules.validateAppointment(doctor, updatedAppointment);
        ensureSlotIsAvailable(updatedAppointment);

        appointments.put(updatedAppointment.getId(), updatedAppointment);
        return updatedAppointment;
    }

    @Override
    public void deleteAppointment(String appointmentId) {
        if (appointments.remove(appointmentId) == null) {
            throw ApiException.notFound("Appointment not found: " + appointmentId);
        }
    }

    @Override
    public DayScheduleResponse getDaySchedule(String appointmentDate) {
        Map<String, Appointment> appointmentsBySlot = getAppointments().stream()
                .filter(appointment -> appointment.getAppointmentDate().equals(appointmentDate))
                .collect(Collectors.toMap(Appointment::getSlotStart, Function.identity()));

        Map<String, Patient> patientsById = getPatients().stream()
                .collect(Collectors.toMap(Patient::getId, Function.identity()));

        List<ScheduleSlot> slots = generateSlotStarts()
                .map(start -> toScheduleSlot(start, appointmentsBySlot, patientsById))
                .toList();

        return new DayScheduleResponse(doctor, appointmentDate, slots);
    }

    @Override
    public List<ScheduleSlot> getAvailableSlots(String appointmentDate, String currentAppointmentId) {
        Optional<Appointment> currentAppointment = Optional.ofNullable(currentAppointmentId)
                .flatMap(this::findAppointment);

        return getDaySchedule(appointmentDate).slots().stream()
                .filter(slot -> slot.available() || isCurrentAppointmentSlot(slot, currentAppointment))
                .toList();
    }

    @Override
    public void seedBaselineData() {
        this.doctor = seedDoctor();
        this.patients.clear();
        seedPatients().forEach(patient -> patients.put(patient.getId(), patient));
        this.appointments.clear();
        seedAppointments().forEach(appointment -> appointments.put(appointment.getId(), appointment));
    }

    private void ensureSlotIsAvailable(Appointment appointment) {
        Optional<Appointment> conflictingAppointment = appointments.values().stream()
                .filter(existingAppointment -> !existingAppointment.getId().equals(appointment.getId()))
                .filter(existingAppointment -> existingAppointment.getDoctorId().equals(appointment.getDoctorId()))
                .filter(existingAppointment -> existingAppointment.getAppointmentDate().equals(appointment.getAppointmentDate()))
                .filter(existingAppointment -> existingAppointment.getSlotStart().equals(appointment.getSlotStart()))
                .findFirst();

        if (conflictingAppointment.isPresent()) {
            throw ApiException.conflict("Slot already booked: " + appointment.getSlotStart());
        }
    }

    private void ensurePatientExists(String patientId) {
        if (!patients.containsKey(patientId)) {
            throw ApiException.badRequest("Appointment patientId must reference an existing patient");
        }
    }

    private ScheduleSlot toScheduleSlot(
            LocalTime start,
            Map<String, Appointment> appointmentsBySlot,
            Map<String, Patient> patientsById
    ) {
        String slotStart = formatTime(start);
        LocalTime end = start.plusMinutes(doctor.getSlotLengthMinutes());
        Appointment appointment = appointmentsBySlot.get(slotStart);
        Patient patient = appointment == null ? null : patientsById.get(appointment.getPatientId());

        return new ScheduleSlot(slotStart, formatTime(end), appointment == null, appointment, patient);
    }

    private boolean isCurrentAppointmentSlot(ScheduleSlot slot, Optional<Appointment> currentAppointment) {
        return currentAppointment
                .map(appointment -> appointment.getSlotStart().equals(slot.start()))
                .orElse(false);
    }

    private Stream<LocalTime> generateSlotStarts() {
        LocalTime start = LocalTime.parse(doctor.getWorkingDayStart());
        LocalTime end = LocalTime.parse(doctor.getWorkingDayEnd());

        return Stream.iterate(start, time -> time.plusMinutes(doctor.getSlotLengthMinutes()))
                .takeWhile(time -> time.isBefore(end));
    }

    private Doctor seedDoctor() {
        Doctor seedDoctor = new Doctor(DOCTOR_ID, "Dr. Eleanor Hayes");
        seedDoctor.setSpecialty("Trauma-informed general practice");
        seedDoctor.setClinicName("CalmAnchor Clinic");
        seedDoctor.setWorkingDayStart("09:00");
        seedDoctor.setWorkingDayEnd("17:00");
        seedDoctor.setSlotLengthMinutes(20);
        seedDoctor.setCreatedAt("2026-07-15T09:00:00Z");
        seedDoctor.setUpdatedAt("2026-07-15T09:00:00Z");
        return seedDoctor;
    }

    private List<Patient> seedPatients() {
        return List.of(
                patient("patient-001", "Maya Okafor", "1991-03-14", "Grounding plan review", "Prefers written summaries after appointments."),
                patient("patient-002", "Liam Carter", "1988-11-02", "Sleep disruption and hypervigilance", "Uses evening breathing exercise plan."),
                patient("patient-003", "Aisha Khan", "1995-06-21", "Care notes update after recent trigger episode", "Responds well to paced check-ins."),
                patient("patient-004", "Noah Williams", "1982-01-19", "Medication side-effect discussion", "Track appetite and fatigue changes."),
                patient("patient-005", "Sofia Rossi", "1999-09-08", "Practitioner toolkit review", "Wants coping-card printout.")
        );
    }

    private Patient patient(String id, String fullName, String dateOfBirth, String historyNotes, String careNotes) {
        Patient patient = new Patient(id, DOCTOR_ID, fullName);
        patient.setDateOfBirth(dateOfBirth);
        patient.setPhoneNumber("+44 7700 900000");
        patient.setHistoryNotes(historyNotes);
        patient.setCareNotes(careNotes);
        patient.setCreatedAt("2026-07-15T09:00:00Z");
        patient.setUpdatedAt("2026-07-15T09:00:00Z");
        return patient;
    }

    private List<Appointment> seedAppointments() {
        return List.of(
                        appointment("appointment-001", "patient-001", "09:00", "Grounding plan review"),
                        appointment("appointment-002", "patient-002", "09:40", "Sleep disruption follow-up"),
                        appointment("appointment-003", "patient-003", "10:00", "Care notes update"),
                        appointment("appointment-004", "patient-004", "11:20", "Medication side-effect discussion"),
                        appointment("appointment-005", "patient-005", "14:00", "Toolkit review")
                ).stream()
                .sorted(Comparator.comparing(Appointment::getSlotStart))
                .toList();
    }

    private Appointment appointment(String id, String patientId, String slotStart, String reason) {
        LocalTime start = LocalTime.parse(slotStart);
        Appointment appointment = new Appointment(
                id,
                DOCTOR_ID,
                patientId,
                APPOINTMENT_DATE,
                slotStart,
                formatTime(start.plusMinutes(doctor.getSlotLengthMinutes()))
        );
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setReason(reason);
        appointment.setNotes("Seeded assessment appointment.");
        appointment.setCreatedAt("2026-07-15T09:00:00Z");
        appointment.setUpdatedAt("2026-07-15T09:00:00Z");
        return appointment;
    }

    private String formatTime(LocalTime time) {
        return time.toString();
    }

    private Appointment copyAppointment(Appointment appointment) {
        Appointment copy = new Appointment(
                appointment.getId(),
                appointment.getDoctorId(),
                appointment.getPatientId(),
                appointment.getAppointmentDate(),
                appointment.getSlotStart(),
                appointment.getSlotEnd()
        );
        copy.setStatus(appointment.getStatus());
        copy.setReason(appointment.getReason());
        copy.setNotes(appointment.getNotes());
        copy.setCreatedAt(appointment.getCreatedAt());
        copy.setUpdatedAt(appointment.getUpdatedAt());
        return copy;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
