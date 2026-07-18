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

Install prerequisites:

- Java 21
- Maven wrapper included in the repo

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

Open Swagger UI:

```text
http://localhost:8081/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8081/v3/api-docs
```

## Mobile

The mobile app uses Expo and React Native.

Install prerequisites:

- Node.js and npm
- Expo Go for local testing
- Android Studio for APK export

```bash
cd mobile
npm install
npm start
```

The mobile app reads from the Spring Boot API for doctor, patient, appointment, schedule, seed, and CRUD workflows.

For Expo Go on a physical phone, use the laptop LAN address:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8081 npm start -- --clear
```

Example used during local testing:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.118:8081 npx expo start --clear --port 8084
```

## APK Build

The assessment asks for an APK exported through Android Studio or Gradle, not only a Metro/Expo Go run.

From the mobile project:

```bash
cd mobile
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

The generated debug APK is expected at:

```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a separate Android emulator or device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The generated `mobile/android/` folder and build outputs are ignored by git because they are local build artifacts.

## Core Assessment Model

The required model is:

```text
Doctor -> Patient
Doctor -> Appointment
Patient -> Appointment
```

Appointments represent booked 20-minute slots between `09:00` and `17:00`. The change appointment form must exclude slots already occupied by another appointment.

Appointment writes are validated by the API. Invalid slot formats return `400`, missing records return `404`, and already-booked slots return `409`.

## Current API Milestone

The API supports seeded Doctor, Patient, and Appointment data plus CRUD endpoints:

- `GET /api/health`
- `GET /api/doctor`
- `PUT /api/doctor`
- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/{patientId}`
- `DELETE /api/patients/{patientId}`
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/{appointmentId}`
- `PATCH /api/appointments/{appointmentId}/slot`
- `DELETE /api/appointments/{appointmentId}`
- `GET /api/schedule`
- `GET /api/schedule/available-slots`
- `POST /api/seed`

See [docs/api-endpoints.md](docs/api-endpoints.md) for details.

## Final Review Notes

- Assessment deadline from the PDF: Thursday, 23 July 2026.
- Current default mode is seed-data mode so reviewers can run the app without private Firebase credentials.
- Firestore persistence is implemented behind the same API contract and can be enabled locally with the private service account JSON.
- Final evidence and reviewer checklist live in [docs/testing-evidence.md](docs/testing-evidence.md) and [docs/final-submission-checklist.md](docs/final-submission-checklist.md).

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

To use Firestore-backed persistence, run with Firebase enabled and keep the service account JSON local:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--firebase.enabled=true
```
