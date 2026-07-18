# Agent Usage Disclosure

AI assistance was used during this assessment to inspect the brief, plan the repository structure, draft documentation, scaffold backend/mobile files, and review implementation gaps.

The candidate reviewed the generated output, asked follow-up questions, corrected direction when needed, ran the app locally, tested Swagger and Expo Go flows, and merged work in feature branches rather than committing one large final batch.

Examples of reviewed areas:

- Repository layout changed from two separate projects to one Spring Boot root with Expo in `mobile/`.
- Firebase service account handling was kept server-side and ignored by git.
- API work was split into seed data, Firestore persistence, CRUD hardening, and Swagger documentation.
- Mobile work was split into API connection and CRUD modules after the API was confirmed working.
- Expo version was adjusted to match the installed Expo Go runtime.

Generated work should continue to be reviewed, edited, tested, and committed deliberately. Commit messages should describe the actual implementation milestone rather than grouping unrelated changes together.
