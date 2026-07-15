package com.calmanchor.calmanchor_api.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class Doctor {

    @NotBlank
    private String id;

    @NotBlank
    private String fullName;

    private String specialty;

    private String clinicName;

    @NotBlank
    private String workingDayStart = "09:00";

    @NotBlank
    private String workingDayEnd = "17:00";

    @Min(1)
    @Max(120)
    private int slotLengthMinutes = 20;

    private String createdAt;

    private String updatedAt;

    public Doctor() {
    }

    public Doctor(String id, String fullName) {
        this.id = id;
        this.fullName = fullName;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getClinicName() {
        return clinicName;
    }

    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }

    public String getWorkingDayStart() {
        return workingDayStart;
    }

    public void setWorkingDayStart(String workingDayStart) {
        this.workingDayStart = workingDayStart;
    }

    public String getWorkingDayEnd() {
        return workingDayEnd;
    }

    public void setWorkingDayEnd(String workingDayEnd) {
        this.workingDayEnd = workingDayEnd;
    }

    public int getSlotLengthMinutes() {
        return slotLengthMinutes;
    }

    public void setSlotLengthMinutes(int slotLengthMinutes) {
        this.slotLengthMinutes = slotLengthMinutes;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}

