# API Endpoints

These endpoints are read-only for the seed-data milestone. They return deterministic in-memory data so the mobile app can be wired before full Firestore CRUD is added.

Base URL:

```text
http://localhost:8081
```

## Seed Data

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Returns API status and seed-data counts. |
| `GET` | `/api/doctor` | Returns the single doctor profile. |
| `GET` | `/api/patients` | Returns the five seeded patients. |
| `GET` | `/api/patients/{patientId}` | Returns one patient by ID. |
| `GET` | `/api/appointments` | Returns seeded appointments for the working day. |
| `GET` | `/api/appointments/{appointmentId}` | Returns one appointment by ID. |
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

## Run Locally

```bash
./mvnw test
./mvnw spring-boot:run
```

The API runs without Firebase by default so the seed endpoints work on a fresh clone. Firebase can be enabled later with:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--firebase.enabled=true
```
