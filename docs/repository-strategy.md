# Repository Strategy

The assessment is implemented as one public repository with two subprojects:

- repository root - Spring Boot API and Firestore integration
- `mobile/` - Expo / React Native doctor-facing app

This keeps the submission aligned with the single-repository requirement while preserving a clean boundary between the Java backend and the mobile client.

## Why This Layout

- The API and mobile app have different runtimes and build tools.
- Firebase Admin credentials stay server-side in the Spring Boot API.
- The mobile app can focus on screens, navigation, and APK export.
- The backend can focus on Doctor, Patient, and Appointment CRUD.
- Reviewers get one GitHub link and one commit history.

## Runtime Map

```text
mobile/
  Expo / React Native UI
  Calls the API on port 8081
  Displays the doctor schedule and patient workflows

repository root
  Spring Boot API
  Owns Firebase Admin SDK setup
  Provides Firestore-backed CRUD endpoints
```

## Branch Progression

The implementation is intentionally split into feature branches so the review history shows steady progress:

- `feature/api-seed-data` - backend seed data, schedule responses, and first endpoint documentation.
- `feature/api-firestore-persistence` - shared data service contract and Firestore-backed persistence.
- `feature/api-crud-hardening` - full API CRUD, validation, errors, and Swagger UI.
- `feature/mobile-api-integration` - mobile client connected to the Spring Boot API.
- `feature/mobile-crud-modules` - mobile CRUD modules for patients, appointments, and doctor settings.
- `feature/final-polish-and-docs` - final run instructions, APK notes, and testing evidence.

Each branch should be merged only after the app is in a working state.
