# Testing Evidence

This file records the final local checks used before submission. It is intended to help reviewers see what was verified without needing private Firebase credentials.

Last verified locally on Saturday, 18 July 2026:

- `./mvnw test` - passed, 9 tests.
- `npx tsc --noEmit` - passed.
- `npx expo install --check` - passed.
- `git diff --check` - passed.

## Backend Checks

Run from the repository root:

```bash
./mvnw test
./mvnw spring-boot:run
```

Expected local URLs:

```text
http://localhost:8081/api/health
http://localhost:8081/swagger-ui.html
http://localhost:8081/v3/api-docs
```

Recommended smoke checks:

```bash
curl http://localhost:8081/api/health
curl http://localhost:8081/api/doctor
curl http://localhost:8081/api/patients
curl http://localhost:8081/api/appointments
curl http://localhost:8081/api/schedule
```

CRUD behavior to verify in Swagger:

- Create, update, and delete a patient.
- Create, update, move, and delete an appointment.
- Confirm a duplicate appointment slot returns `409 Conflict`.
- Confirm a missing patient or appointment returns `404 Not Found`.
- Reset seed data with `POST /api/seed`.

## Mobile Checks

Run from the mobile folder:

```bash
npm install
npx tsc --noEmit
npx expo install --check
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8081 npm start -- --clear
```

Mobile behavior to verify:

- Dashboard loads live API data.
- Patients tab supports search, pagination, create, edit, and delete.
- Appointments tab supports search, pagination, create, edit, delete, and slot movement.
- Doctor tab updates the profile and schedule settings.
- Reset seed data refreshes the mobile UI.

## Firebase Mode

The default mode is seed mode:

```properties
firebase.enabled=false
```

Firestore mode uses the same endpoint contract:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--firebase.enabled=true
```

The private service account file must stay local:

```text
src/main/resources/firebase-service-account.json
```
