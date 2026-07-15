package com.calmanchor.calmanchor_api.controller;

import com.calmanchor.calmanchor_api.dto.ApiHealthResponse;
import com.calmanchor.calmanchor_api.dto.AppointmentSlotUpdateRequest;
import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;
import com.calmanchor.calmanchor_api.service.ClinicDataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api")
public class AssessmentDataController {

    private final ClinicDataService clinicDataService;

    public AssessmentDataController(ClinicDataService clinicDataService) {
        this.clinicDataService = clinicDataService;
    }

    @GetMapping("/health")
    public ApiHealthResponse getHealth() {
        return new ApiHealthResponse(
                "ok",
                clinicDataService.getDataMode(),
                clinicDataService.getPatients().size(),
                clinicDataService.getAppointments().size(),
                clinicDataService.getDaySchedule(ClinicDataService.APPOINTMENT_DATE).slots().size()
        );
    }

    @PostMapping("/seed")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiHealthResponse seedBaselineData() {
        clinicDataService.seedBaselineData();
        return getHealth();
    }

    @GetMapping("/doctor")
    public Doctor getDoctor() {
        return clinicDataService.getDoctor();
    }

    @PutMapping("/doctor")
    public Doctor updateDoctor(@Valid @RequestBody Doctor doctor) {
        return clinicDataService.saveDoctor(doctor);
    }

    @GetMapping("/patients")
    public List<Patient> getPatients() {
        return clinicDataService.getPatients();
    }

    @PostMapping("/patients")
    @ResponseStatus(HttpStatus.CREATED)
    public Patient createPatient(@RequestBody Patient patient) {
        return clinicDataService.savePatient(patient);
    }

    @GetMapping("/patients/{patientId}")
    public Patient getPatient(@PathVariable String patientId) {
        return clinicDataService.findPatient(patientId)
                .orElseThrow(() -> notFound("Patient not found: " + patientId));
    }

    @PutMapping("/patients/{patientId}")
    public Patient updatePatient(@PathVariable String patientId, @RequestBody Patient patient) {
        patient.setId(patientId);
        return clinicDataService.savePatient(patient);
    }

    @DeleteMapping("/patients/{patientId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePatient(@PathVariable String patientId) {
        clinicDataService.deletePatient(patientId);
    }

    @GetMapping("/appointments")
    public List<Appointment> getAppointments() {
        return clinicDataService.getAppointments();
    }

    @PostMapping("/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    public Appointment createAppointment(@RequestBody Appointment appointment) {
        return clinicDataService.saveAppointment(appointment);
    }

    @GetMapping("/appointments/{appointmentId}")
    public Appointment getAppointment(@PathVariable String appointmentId) {
        return clinicDataService.findAppointment(appointmentId)
                .orElseThrow(() -> notFound("Appointment not found: " + appointmentId));
    }

    @PutMapping("/appointments/{appointmentId}")
    public Appointment updateAppointment(@PathVariable String appointmentId, @RequestBody Appointment appointment) {
        appointment.setId(appointmentId);
        return clinicDataService.saveAppointment(appointment);
    }

    @PatchMapping("/appointments/{appointmentId}/slot")
    public Appointment moveAppointment(
            @PathVariable String appointmentId,
            @Valid @RequestBody AppointmentSlotUpdateRequest request
    ) {
        if (clinicDataService.findAppointment(appointmentId).isEmpty()) {
            throw notFound("Appointment not found: " + appointmentId);
        }
        return clinicDataService.moveAppointment(appointmentId, request);
    }

    @DeleteMapping("/appointments/{appointmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointment(@PathVariable String appointmentId) {
        clinicDataService.deleteAppointment(appointmentId);
    }

    @GetMapping("/schedule")
    public DayScheduleResponse getSchedule(
            @RequestParam(defaultValue = ClinicDataService.APPOINTMENT_DATE) String date
    ) {
        return clinicDataService.getDaySchedule(date);
    }

    @GetMapping("/schedule/available-slots")
    public List<ScheduleSlot> getAvailableSlots(
            @RequestParam(defaultValue = ClinicDataService.APPOINTMENT_DATE) String date,
            @RequestParam(required = false) String currentAppointmentId
    ) {
        return clinicDataService.getAvailableSlots(date, currentAppointmentId);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleConflict(IllegalArgumentException exception) {
        return exception.getMessage();
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
