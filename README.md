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
mvn test
```

Run the API:

```bash
mvn spring-boot:run
```

The API listens on port `8081`.

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
