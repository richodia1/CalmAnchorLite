package com.calmanchor.calmanchor_api.controller;

import com.calmanchor.calmanchor_api.dto.ApiHealthResponse;
import com.calmanchor.calmanchor_api.dto.DayScheduleResponse;
import com.calmanchor.calmanchor_api.dto.ScheduleSlot;
import com.calmanchor.calmanchor_api.model.Appointment;
import com.calmanchor.calmanchor_api.model.Doctor;
import com.calmanchor.calmanchor_api.model.Patient;
import com.calmanchor.calmanchor_api.service.SeedDataService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api")
public class AssessmentDataController {

    private final SeedDataService seedDataService;

    public AssessmentDataController(SeedDataService seedDataService) {
        this.seedDataService = seedDataService;
    }

    @GetMapping("/health")
    public ApiHealthResponse getHealth() {
        return new ApiHealthResponse(
                "ok",
                "seed",
                seedDataService.getPatients().size(),
                seedDataService.getAppointments().size(),
                seedDataService.getDaySchedule(SeedDataService.APPOINTMENT_DATE).slots().size()
        );
    }

    @GetMapping("/doctor")
    public Doctor getDoctor() {
        return seedDataService.getDoctor();
    }

    @GetMapping("/patients")
    public List<Patient> getPatients() {
        return seedDataService.getPatients();
    }

    @GetMapping("/patients/{patientId}")
    public Patient getPatient(@PathVariable String patientId) {
        return seedDataService.findPatient(patientId)
                .orElseThrow(() -> notFound("Patient not found: " + patientId));
    }

    @GetMapping("/appointments")
    public List<Appointment> getAppointments() {
        return seedDataService.getAppointments();
    }

    @GetMapping("/appointments/{appointmentId}")
    public Appointment getAppointment(@PathVariable String appointmentId) {
        return seedDataService.findAppointment(appointmentId)
                .orElseThrow(() -> notFound("Appointment not found: " + appointmentId));
    }

    @GetMapping("/schedule")
    public DayScheduleResponse getSchedule(
            @RequestParam(defaultValue = SeedDataService.APPOINTMENT_DATE) String date
    ) {
        return seedDataService.getDaySchedule(date);
    }

    @GetMapping("/schedule/available-slots")
    public List<ScheduleSlot> getAvailableSlots(
            @RequestParam(defaultValue = SeedDataService.APPOINTMENT_DATE) String date,
            @RequestParam(required = false) String currentAppointmentId
    ) {
        return seedDataService.getAvailableSlots(date, currentAppointmentId);
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
