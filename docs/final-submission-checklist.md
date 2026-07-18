# Final Submission Checklist

Assessment dates from the supplied PDF:

- Task issued: Saturday, 11 July 2026.
- Submission deadline: Thursday, 23 July 2026.
- Shortlisting decision: Saturday, 25 July 2026.
- Interviews: Monday, 27 July 2026.
- Internship start date: Saturday, 1 August 2026.

## Repository

- Public GitHub repository: `CalmAnchorLite`.
- Single repository containing the Spring Boot API and Expo mobile app.
- Feature branches used for meaningful milestones.
- Main branch should only contain merged, working states.
- Documentation is kept inside `docs/`.

## Backend

- Spring Boot API runs on port `8081`.
- Swagger UI is available at `http://localhost:8081/swagger-ui.html`.
- OpenAPI JSON is available at `http://localhost:8081/v3/api-docs`.
- Seed mode works without Firebase credentials.
- Firestore mode can be enabled with the private service account JSON.
- Doctor, Patient, and Appointment CRUD is implemented.
- Appointment slot validation prevents invalid times and already-booked slots.

## Mobile

- Expo app lives in `mobile/`.
- App connects to the Spring Boot API through `EXPO_PUBLIC_API_URL`.
- Dashboard shows schedule and appointment summary.
- Patients module supports list, search, pagination, create, edit, and delete.
- Appointments module supports list, search, pagination, create, edit, delete, and slot movement.
- Doctor module supports profile and clinic schedule editing.

## Before Final Submission

- Run `./mvnw test`.
- Run `cd mobile && npx tsc --noEmit`.
- Run `cd mobile && npx expo install --check`.
- Start the API and verify Swagger UI.
- Start the mobile app with the laptop LAN API URL.
- Export an APK through Android Studio or Gradle.
- Install the APK on a separate Android emulator or device.
- Record the required walkthrough video against the installed APK.

## Walkthrough Video Outline

1. Show the repository structure and `docs/` folder.
2. Show the branch/merge history and explain the staged progress.
3. Start or show the Spring Boot API and Swagger UI.
4. Show the mobile dashboard.
5. Demonstrate patient CRUD.
6. Demonstrate appointment CRUD and rescheduling to an available slot.
7. Show doctor profile/settings update.
8. Explain Firebase seed mode versus Firestore mode.
9. Show final tests and APK installation evidence.
