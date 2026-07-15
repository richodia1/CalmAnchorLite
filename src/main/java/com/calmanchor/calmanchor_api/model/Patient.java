package com.calmanchor.calmanchor_api.model;

import jakarta.validation.constraints.NotBlank;

public class Patient {

    @NotBlank
    private String id;

    @NotBlank
    private String doctorId;

    @NotBlank
    private String fullName;

    private String dateOfBirth;

    private String phoneNumber;

    private String historyNotes;

    private String careNotes;

    private String createdAt;

    private String updatedAt;

    public Patient() {
    }

    public Patient(String id, String doctorId, String fullName) {
        this.id = id;
        this.doctorId = doctorId;
        this.fullName = fullName;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getHistoryNotes() {
        return historyNotes;
    }

    public void setHistoryNotes(String historyNotes) {
        this.historyNotes = historyNotes;
    }

    public String getCareNotes() {
        return careNotes;
    }

    public void setCareNotes(String careNotes) {
        this.careNotes = careNotes;
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

