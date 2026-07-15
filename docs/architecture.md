# Architecture Note

CalmAnchor Lite is split into two subprojects inside one repository.

## Backend

The Spring Boot API is responsible for:

- Firebase Admin SDK initialization.
- Firestore data access.
- CRUD operations for Doctor, Patient, and Appointment records.
- Schedule logic, including booked-slot filtering.

The backend owns the Firebase service account JSON. The mobile app must not contain server credentials.

## Mobile

The Expo app is responsible for:

- Doctor-facing screens.
- Schedule display.
- Patient list and detail workflows.
- Change appointment form.
- APK export.

## Data Boundary

The mobile app should call backend endpoints rather than connecting to Firebase Admin directly. That keeps credentials private and makes the assessment's relational data logic easier to review.

