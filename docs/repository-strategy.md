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

