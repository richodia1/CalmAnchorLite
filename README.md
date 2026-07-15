# CalmAnchor Lite

CalmAnchor Lite is a single-repository assessment project with a Spring Boot API at the root and an Expo / React Native app in `mobile/`.

## Structure

```text
.
├── docs/        # Assessment PDF and project documentation
├── mobile/      # Expo / React Native app
├── src/         # Spring Boot API
├── pom.xml      # Maven configuration
└── README.md
```

## Backend

The API uses Java 21, Spring Boot, Maven, Firebase Admin SDK, and Firestore.

Run tests:

```bash
./mvnw test
```

Run the API:

```bash
./mvnw spring-boot:run
```

The API listens on port `8081`.

Check the running API:

```bash
curl http://localhost:8081/api/health
```

## Mobile

The mobile app uses Expo and React Native.

```bash
cd mobile
npm install
npm start
```

## Core Assessment Model

The required model is:

```text
Doctor -> Patient
Doctor -> Appointment
Patient -> Appointment
```

Appointments represent booked 20-minute slots between `09:00` and `17:00`. The change appointment form must exclude slots already occupied by another appointment.

## Current API Milestone

The `feature/api-seed-data` branch adds read-only seed endpoints for the first working slice:

- `GET /api/health`
- `GET /api/doctor`
- `GET /api/patients`
- `GET /api/appointments`
- `GET /api/schedule`
- `GET /api/schedule/available-slots`

See [docs/api-endpoints.md](docs/api-endpoints.md) for details.

## Secret Handling

The Firebase Admin SDK JSON is stored locally at:

```text
src/main/resources/firebase-service-account.json
```

It is intentionally ignored by git.

The API runs in seed-data mode by default:

```properties
firebase.enabled=false
```

When Firestore-backed repositories are added, run with Firebase enabled and keep the service account JSON local:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--firebase.enabled=true
```
