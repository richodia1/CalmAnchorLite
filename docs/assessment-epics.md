# CalmAnchor Lite Assessment Epics

This plan translates the assessment PDF into sequential implementation milestones.

## Epic 1 - Repository Setup and Documentation

- Keep Spring Boot at the repository root.
- Keep Expo / React Native in `mobile/`.
- Keep assessment documentation in `docs/`.
- Add database schema, repository strategy, architecture note, user journey, and screen map.

## Epic 2 - Backend Model and Seed Data

- Implement `Doctor`, `Patient`, and `Appointment` models.
- Link patients to the doctor with `Patient.doctorId`.
- Link appointments to the doctor and patient with `Appointment.doctorId` and `Appointment.patientId`.
- Seed one doctor, five patients, and sample appointments.
- Expose read-only endpoints for the seeded doctor, patients, appointments, schedule, and available slots.

## Epic 3 - Read-Only Day Schedule

- Add an API response that returns generated day slots from `09:00` to `17:00`.
- Merge appointments into generated slots.
- Show booked and available slots in the mobile app.

## Epic 4 - Patient Screens

- Add Patient List.
- Add Patient Detail.
- Show history notes and appointment summary.

## Epic 5 - Change Appointment Form

- Add appointment update logic.
- Show only available slots.
- Exclude slots already occupied by another appointment.
- Refresh the schedule after rescheduling.

## Epic 6 - Full CRUD and Settings/Profile

- Add CRUD for Doctor, Patient, and Appointment.
- Add Settings/Profile for the single doctor record.
- Keep delete operations simple and confirmed.

## Epic 7 - APK and Video Evidence

- Export an APK through Android Studio/Gradle.
- Install it on a separate Android emulator.
- Record a 7-10 minute walkthrough of the app, docs, and repository.
