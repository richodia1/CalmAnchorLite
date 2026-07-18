package com.calmanchor.calmanchor_api.service;

import com.calmanchor.calmanchor_api.dto.AppointmentSlotUpdateRequest;
import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.exception.ApiException;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@ConditionalOnProperty(prefix = "firebase", name = "enabled", havingValue = "true")
public class FirestoreDataService implements ClinicDataService {

    private static final String DOCTORS = "doctors";
    private static final String PATIENTS = "patients";
    private static final String APPOINTMENTS = "appointments";

    private final Firestore firestore;
    private final SeedDataService seedDataService = new SeedDataService();

    public FirestoreDataService(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public String getDataMode() {
        return "firestore";
    }

    @Override
    public Doctor getDoctor() {
        return findDoctor(DOCTOR_ID)
                .orElseGet(seedDataService::getDoctor);
    }

    @Override
    public Doctor saveDoctor(Doctor doctor) {
        if (isBlank(doctor.getId())) {
            doctor.setId(DOCTOR_ID);
        }
        ScheduleRules.validateDoctor(doctor);

        await(firestore.collection(DOCTORS).document(doctor.getId()).set(doctor));
        return doctor;
    }

    @Override
    public List<Patient> getPatients() {
        return await(firestore.collection(PATIENTS).whereEqualTo("doctorId", DOCTOR_ID).get())
                .getDocuments()
                .stream()
                .map(document -> toObject(document, Patient.class))
                .sorted(Comparator.comparing(Patient::getFullName))
                .toList();
    }

    @Override
    public Optional<Patient> findPatient(String patientId) {
        DocumentSnapshot document = await(firestore.collection(PATIENTS).document(patientId).get());
        return Optional.ofNullable(toObject(document, Patient.class));
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

        await(firestore.collection(PATIENTS).document(patient.getId()).set(patient));
        return patient;
    }

    @Override
    public void deletePatient(String patientId) {
        findPatient(patientId)
                .orElseThrow(() -> ApiException.notFound("Patient not found: " + patientId));
        await(firestore.collection(PATIENTS).document(patientId).delete());

        QuerySnapshot patientAppointments = await(firestore.collection(APPOINTMENTS)
                .whereEqualTo("patientId", patientId)
                .get());

        patientAppointments.getDocuments()
                .forEach(document -> await(document.getReference().delete()));
    }

    @Override
    public List<Appointment> getAppointments() {
        return await(firestore.collection(APPOINTMENTS).whereEqualTo("doctorId", DOCTOR_ID).get())
                .getDocuments()
                .stream()
                .map(document -> toObject(document, Appointment.class))
                .sorted(Comparator.comparing(Appointment::getSlotStart))
                .toList();
    }

    @Override
    public Optional<Appointment> findAppointment(String appointmentId) {
        DocumentSnapshot document = await(firestore.collection(APPOINTMENTS).document(appointmentId).get());
        return Optional.ofNullable(toObject(document, Appointment.class));
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
        ScheduleRules.validateAppointment(getDoctor(), appointment);
        ensureSlotIsAvailable(appointment);

        await(firestore.collection(APPOINTMENTS).document(appointment.getId()).set(appointment));
        return appointment;
    }

    @Override
    public Appointment moveAppointment(String appointmentId, AppointmentSlotUpdateRequest request) {
        Appointment appointment = findAppointment(appointmentId)
                .orElseThrow(() -> ApiException.notFound("Appointment not found: " + appointmentId));

        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setSlotStart(request.slotStart());
        appointment.setSlotEnd(request.slotEnd());
        ScheduleRules.validateAppointment(getDoctor(), appointment);
        ensureSlotIsAvailable(appointment);

        await(firestore.collection(APPOINTMENTS).document(appointment.getId()).set(appointment));
        return appointment;
    }

    @Override
    public void deleteAppointment(String appointmentId) {
        findAppointment(appointmentId)
                .orElseThrow(() -> ApiException.notFound("Appointment not found: " + appointmentId));
        await(firestore.collection(APPOINTMENTS).document(appointmentId).delete());
    }

    @Override
    public DayScheduleResponse getDaySchedule(String appointmentDate) {
        Doctor doctor = getDoctor();
        Map<String, Appointment> appointmentsBySlot = getAppointments().stream()
                .filter(appointment -> appointment.getAppointmentDate().equals(appointmentDate))
                .collect(Collectors.toMap(Appointment::getSlotStart, Function.identity()));

        Map<String, Patient> patientsById = getPatients().stream()
                .collect(Collectors.toMap(Patient::getId, Function.identity()));

        List<ScheduleSlot> slots = generateSlotStarts(doctor)
                .map(start -> toScheduleSlot(doctor, start, appointmentsBySlot, patientsById))
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
        saveDoctor(seedDataService.getDoctor());
        seedDataService.getPatients().forEach(this::savePatient);
        seedDataService.getAppointments().forEach(this::saveAppointment);
    }

    private Optional<Doctor> findDoctor(String doctorId) {
        DocumentSnapshot document = await(firestore.collection(DOCTORS).document(doctorId).get());
        return Optional.ofNullable(toObject(document, Doctor.class));
    }

    private void ensureSlotIsAvailable(Appointment appointment) {
        Optional<Appointment> conflictingAppointment = getAppointments().stream()
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
        findPatient(patientId)
                .orElseThrow(() -> ApiException.badRequest("Appointment patientId must reference an existing patient"));
    }

    private ScheduleSlot toScheduleSlot(
            Doctor doctor,
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

    private Stream<LocalTime> generateSlotStarts(Doctor doctor) {
        LocalTime start = LocalTime.parse(doctor.getWorkingDayStart());
        LocalTime end = LocalTime.parse(doctor.getWorkingDayEnd());

        return Stream.iterate(start, time -> time.plusMinutes(doctor.getSlotLengthMinutes()))
                .takeWhile(time -> time.isBefore(end));
    }

    private String formatTime(LocalTime time) {
        return time.toString();
    }

    private <T> T toObject(DocumentSnapshot document, Class<T> type) {
        if (!document.exists()) {
            return null;
        }
        return document.toObject(type);
    }

    private <T> T await(ApiFuture<T> future) {
        try {
            return future.get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Firestore operation interrupted", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("Firestore operation failed", exception);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
