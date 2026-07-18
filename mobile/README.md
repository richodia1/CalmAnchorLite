# CalmAnchor Lite Mobile

Expo SDK 54 / React Native app for the doctor-facing CalmAnchor Lite workflow.

## Run

```bash
npm install
npm start
```

The app loads live doctor, patient, schedule, and appointment data from the Spring Boot API. The layout uses a clinical dashboard style with modules for dashboard review, patient CRUD, appointment CRUD, and doctor profile management.

Expo runs on port `8082` so the Spring Boot API can keep using port `8081`.

Default API URLs:

```text
iOS simulator / web: http://localhost:8081
Android emulator: http://10.0.2.2:8081
```

For Expo Go on a physical phone, start Expo with the laptop LAN address:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8081 npm start -- --clear
```
