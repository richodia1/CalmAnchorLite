# API Endpoints

These endpoints support the CalmAnchor Lite backend milestone. By default, the API runs in in-memory seed mode so it can be reviewed without private Firebase credentials. When `firebase.enabled=true`, the same endpoint contract is backed by Firestore.

Base URL:

```text
http://localhost:8081
```

## Health and Seed Data

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Returns API status and seed-data counts. |
| `POST` | `/api/seed` | Recreates the baseline doctor, five patients, and sample appointments in the active data store. |
| `GET` | `/api/doctor` | Returns the single doctor profile. |
| `PUT` | `/api/doctor` | Updates the single doctor profile. |
| `GET` | `/api/patients` | Returns the five seeded patients. |
| `POST` | `/api/patients` | Creates a patient. |
| `GET` | `/api/patients/{patientId}` | Returns one patient by ID. |
| `PUT` | `/api/patients/{patientId}` | Updates one patient. |
| `DELETE` | `/api/patients/{patientId}` | Deletes one patient and their appointments. |
| `GET` | `/api/appointments` | Returns seeded appointments for the working day. |
| `POST` | `/api/appointments` | Creates an appointment if the selected slot is free. |
| `GET` | `/api/appointments/{appointmentId}` | Returns one appointment by ID. |
| `PUT` | `/api/appointments/{appointmentId}` | Updates one appointment if the selected slot is free. |
| `PATCH` | `/api/appointments/{appointmentId}/slot` | Moves an appointment to a different slot. |
| `DELETE` | `/api/appointments/{appointmentId}` | Deletes one appointment. |
| `GET` | `/api/schedule` | Returns all generated 20-minute slots with appointment data merged in. |
| `GET` | `/api/schedule/available-slots` | Returns slots available for the change appointment form. |

## Schedule Date

The seeded appointment date is:

```text
2026-08-01
```

The schedule endpoint accepts an optional date:

```text
GET /api/schedule?date=2026-08-01
```

The available slots endpoint accepts the same date and an optional current appointment ID:

```text
GET /api/schedule/available-slots?date=2026-08-01&currentAppointmentId=appointment-001
```

When `currentAppointmentId` is provided, that appointment's current slot remains selectable while other booked slots are excluded.

## Move Appointment Request

```http
PATCH /api/appointments/appointment-001/slot
Content-Type: application/json
```

```json
{
  "appointmentDate": "2026-08-01",
  "slotStart": "09:20",
  "slotEnd": "09:40"
}
```

The API returns `409 Conflict` if another appointment already occupies the target slot.

## Validation Rules

Appointment writes are validated before saving:

- `patientId` must reference an existing patient.
- `doctorId` must match the active doctor.
- `appointmentDate` must use `yyyy-MM-dd`.
- `slotStart` and `slotEnd` must use `HH:mm`.
- `slotStart` must align to the doctor's 20-minute slot length.
- `slotEnd` must be exactly one slot length after `slotStart`.
- The slot must sit inside the doctor's configured working day.

## Error Shape

API errors use a consistent JSON response:

```json
{
  "timestamp": "2026-07-18T16:00:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Slot already booked: 09:40",
  "path": "/api/appointments"
}
```

Common statuses:

- `400 Bad Request` - invalid IDs, date format, time format, or slot alignment.
- `404 Not Found` - missing patient or appointment.
- `409 Conflict` - target appointment slot is already booked.

## Run Locally

```bash
./mvnw test
./mvnw spring-boot:run
```

The API runs without Firebase by default so the seed endpoints work on a fresh clone. Firebase can be enabled later with:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--firebase.enabled=true
```

Then seed Firestore:

```bash
curl -X POST http://localhost:8081/api/seed
```
