# CalmAnchor Lite Data Model

This schema follows the assessment baseline: one doctor manages five patients and one working day of 20-minute appointments.

```mermaid
erDiagram
    DOCTOR ||--o{ PATIENT : manages
    DOCTOR ||--o{ APPOINTMENT : owns
    PATIENT ||--o{ APPOINTMENT : attends

    DOCTOR {
        string id
        string fullName
        string specialty
        string clinicName
        string workingDayStart
        string workingDayEnd
        int slotLengthMinutes
        string createdAt
        string updatedAt
    }

    PATIENT {
        string id
        string doctorId
        string fullName
        string dateOfBirth
        string phoneNumber
        string historyNotes
        string careNotes
        string createdAt
        string updatedAt
    }

    APPOINTMENT {
        string id
        string doctorId
        string patientId
        string appointmentDate
        string slotStart
        string slotEnd
        string status
        string reason
        string notes
        string createdAt
        string updatedAt
    }
```

## Slot Rules

- Working day starts at `09:00`.
- Working day ends at `17:00`.
- Slot length is `20` minutes.
- Total available slots: `24`.
- A slot is available when no appointment exists with the same `doctorId`, `appointmentDate`, and `slotStart`.
- When changing an appointment, exclude all booked slots except the appointment's current slot.

## Seed Data Target

- 1 doctor.
- 5 patients linked to that doctor.
- Sample appointments across the working day.
- Enough empty slots to prove that rescheduling filters booked slots correctly.

