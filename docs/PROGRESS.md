# Progress log (update this at the end of every session)

Last updated: 2026-10-27 (Target screen: added guidance that target is for upcoming exams)

## Done
- [x] Project scaffold: Vite + React + PWA plugin, icons, manifest
- [x] Calculation engine (`src/engine/engine.js`) with 42 passing tests
- [x] Store and navigation (`src/state/store.jsx`), derived values (`src/derive.js`)
- [x] Screens: Welcome, Setup (school maximum units), Stage, Results (Summary / Exact points / Course by course), Courses (steppers by unit size), Target (CGPA / Class / Best), Result (achievable, impossible, straight As, safe, best; plan tabs; Aim and Floor; extra-units tip), Final Semester Mode, Cross-check
- [x] Smoke test rendering 24 screen states; `npm run check` passes
- [x] Guest mode saves nothing

## Next up (do these in order)
1. [x] **Course options** screen (cap, floor, locked grade, difficulty, retake, counts-toward-CGPA) wired into `courseList()` and the engine's `cap/floor/locked/difficulty`. See DESIGN.md 4.10.
2. [ ] **What-if** screen using `E.whatIf` with the "spare points left" bar (DESIGN.md 4.10), linked from the Result screen ("Try a what-if ›").
3. [ ] **Share preview** screen (image via canvas or `html-to-image`, plus "Copy as text"; Web Share API).
4. [ ] **Guest warning** bottom sheet when the student presses Back from Result in guest mode.
5. [ ] **Remaining semesters** step (number left, estimated units, optional total units to graduate) and the multi-semester split using `E.planSemesters`.
6. [ ] Opening balance (units + points) alongside course-by-course entry; retake and "does not count toward CGPA" flags in the Results entry UI.
7. [ ] **Accounts and local-first storage**: Firebase Auth (passwordless email) and Firestore, using the local-first design in AGENTS.md (device copy in IndexedDB or Firestore persistent cache, debounced sync, ask-on-conflict, wipe on sign-out and delete). Enter-code screen, guest-to-account prompt, delete account, privacy and consent screen. Guest mode must stay save-nothing. Add tests for the sync and conflict logic.
8. [ ] Settings screen (school maximum units, scale and thresholds, retake and rounding policies, account, reset).
9. [ ] Dark mode (tokens in `styles.css` are ready to be overridden).
10. [ ] Browser tests (Playwright) for the main flows; deploy to Vercel.

## Known gaps and honest notes
- Only the 5-point scale is supported in the UI (the engine accepts a custom scale through config).
- Extra-units advice assumes extra courses can score the top grade unless `extraCap` is passed (no UI for it yet).
- The cross-check "Use these results" button moves to Courses and sets stage "has"; it keeps the entries but not the school figure.
- The screens were checked by rendering to HTML in Node (`npm run smoke`) and by a production build, not yet in a real browser. Please open it on a phone-size viewport and note any visual differences from `docs/DESIGN.md`.
- Several rules are assumptions until the owner confirms them (see Open decisions in REQUIREMENTS.md).

## Questions for the owner
(Add questions here; the owner answers them in chat.)

## Changelog
- 2026-10-24: Initial scaffold, engine, eight screens, tests, docs.
- 2026-10-24: Recorded the local-first storage decision (device cache for signed-in students, backend as durable backup) in AGENTS.md and task 7.
- 2026-10-24: Built Course Options screen (`src/screens/CourseOptions.jsx`). Added `courseOptions` and `editingCourseIdx` to store. Updated `courseList()` in `derive.js` to pass `cap/floor/locked/difficulty` to the engine. Updated Courses screen with "Set grade limits for a course" link and inline tags showing configured courses. Added 3 smoke test cases (27 total). Fixed `smoke.mjs` Windows path resolution (`fileURLToPath` instead of `URL.pathname`). `npm run check` passes (42 tests, 27 smoke screens, production build).
- 2026-10-27: Added canonical link and Open Graph / Twitter meta tags to `index.html`. Moved `og-image.jpg` into `public/` so it is served at `/og-image.jpg` and included in `dist/`. `npm run check` passes.
- 2026-10-27: Target screen (`src/screens/Target.jsx`): Added clear callout notes and updated field hints explaining that the target CGPA is for the student’s upcoming exams (not final graduation CGPA) and that the recommendations help them climb steadily toward their desired CGPA. Added `.callout` styles to `styles.css`. Updated `docs/DESIGN.md`. `npm run check` passes.
- 2026-10-27: Configured Firebase with credentials in `.env.local`. Implemented all 3 authentication methods on Welcome screen (`src/screens/Welcome.jsx`): Google Sign-In popup, Passwordless Magic Link with return detection, and Email + Password (sign-in, sign-up with password confirmation, and password reset). Built native IndexedDB device cache (`src/storage/db.js` & `src/storage/storage.js`) with persistent storage request and sign-out cache wipe. Wired StoreProvider (`src/state/store.jsx`) to load instantly from device cache and auto-save. `npm run check` passes (42 tests, 29 smoke screens, production build).
- 2026-10-29: Added "What's New: Sign-in is now live!" banner to Welcome screen (`src/screens/Welcome.jsx`). Configured Firebase Cloud Messaging & Web Push foundation (`src/storage/notifications.js` and `public/firebase-messaging-sw.js`) with opt-in card so students can subscribe to notifications. Tested with browser subagent on `http://localhost:5173/` (zero console errors). `npm run check` passes (42 tests, 29 smoke screens, production build).
- 2026-10-29: Cleaned `src/storage/firebase.js` to strictly read from environment variables (local `.env.local` and Vercel dashboard environment variables) with zero hardcoded API keys in repository. Removed school-only email restrictions across auth forms (changed labels to "Email" and placeholders to generic `name@example.com`). Converted VAO logo image into high-fidelity inline SVG component (`src/components/VaoLogo.jsx`) with teal accent triangle and horizontal bar. Added "Powered by [VAO Logo]" footer to Welcome screen. Browser subagent verified zero console errors. `npm run check` passes.
