# CGPA Target Planner: project brief for AI coding agents

Read this file first, then `docs/PROGRESS.md` (what is done, what is next), then `docs/DESIGN.md` (what every screen must look like; the original Figma file is NOT available to you) and `docs/REQUIREMENTS.md` (what the app must do).

## What this is
A mobile-first web app (PWA) for Nigerian university students. The student enters the results they already have (or nothing, if fresh in 100 level), the courses still to be graded, and a target (a CGPA, a class of degree, or "best I can do"). The app answers: *Is my target possible? What is the minimum I need? Which grade combinations get me there?* It also (a) asks for the school's maximum units per semester so it can say whether a few extra units would make a target possible, and (b) cross-checks a student's own results against the CGPA their school printed.

Owner: Victor (Redeemer's University, Ede, Osun State). Skills: frontend, Firebase, Vercel. Hosting plan: Vercel. Backend plan (later, for sign-in): Firebase.

## How to continue (follow this every session)
1. Read this file, `docs/PROGRESS.md`, and the relevant part of `docs/DESIGN.md` and `docs/REQUIREMENTS.md`.
2. Pick the first unchecked task under "Next up" in `docs/PROGRESS.md` (or the task the user gives you).
3. Make the change. Keep the engine pure and tested (see rules below).
4. Run `npm run check` (engine tests + screen smoke test + production build). Fix anything that fails.
5. Update `docs/PROGRESS.md`: tick finished tasks, add a dated line to the changelog, and write down anything half-done, any decision you made, and any question for the user. The next agent depends on this.
6. If you change behaviour, update `docs/REQUIREMENTS.md` or `docs/DESIGN.md` in the same change.

## Commands
- `npm install`
- `npm run dev` (Vite dev server)
- `npm test` (engine unit tests: 42 cases, plain Node, no framework)
- `npm run smoke` (renders every screen in 24 realistic states, checks key text)
- `npm run build` (production build + PWA service worker)
- `npm run check` (all three)

## Stack and layout
Vite + React 18 (JavaScript, no TypeScript yet), plain CSS, `vite-plugin-pwa`. No router: a small state machine decides the screen.
```
src/
  engine/engine.js        pure calculation engine (ES module). THE source of truth for every number.
  engine/engine.test.js   unit tests (worked examples from the requirements)
  state/store.jsx         useReducer store + context (screen, navigation stack, inputs)
  derive.js               turns raw screen state into engine inputs (previous P/Q, courses, target)
  components/ui.jsx       Screen, Title, Btn, Chip, ChipRow, Opt, Seg, Field, Card, Pill
  screens/                Welcome, Setup, Stage, Results, Courses, CourseOptions, Target, Result, WhatIf, CrossCheck
  styles.css              design tokens and all styles (see docs/DESIGN.md)
scripts/smoke*.{mjs,jsx}  render-every-screen smoke test
docs/                     REQUIREMENTS.md, DESIGN.md, PROGRESS.md
```

## Hard rules
1. **All maths lives in `src/engine/engine.js`.** Screens never calculate grades, CGPA or verdicts themselves. Add or change maths in the engine first, with a test in `engine.test.js`.
2. **Whole-number arithmetic.** Quality points are integers. Targets are handled in hundredths. Never compare floats for equality; the engine already shows how.
3. **Guest mode saves nothing.** No `localStorage`, `sessionStorage`, IndexedDB, cookies or analytics that identify the student. State is in memory only. Signed-in students are different: their data is kept on the device and synced to the backend (see "Accounts and storage" below). That local copy exists only for a signed-in student, and sign-out and delete-account wipe it.
4. **Be honest about impossibility.** When a target cannot be reached, say so plainly and show the best possible result. Never soften a verdict.
5. **Accessibility:** real `<button>`/`<input>`/`<label>` elements, 44px minimum touch targets, visible focus, `aria-live` on changing totals, errors with `role="alert"`, never colour alone to carry meaning, respect `prefers-reduced-motion`.
6. **Copy:** plain, friendly, student-level English. Use the typographic apostrophe (’) in visible text. No brand logos (no Apple, Google or phone-maker marks). Do not invent facts about Nigerian universities; school rules are configurable assumptions.
7. **Do not expand scope silently.** If something is not in `docs/REQUIREMENTS.md`, ask the user or note it in `docs/PROGRESS.md` under "Questions".

## Engine API (src/engine/engine.js, `import * as E from './engine/engine.js'`)
Terms: `P` previous units, `Q` previous quality points, `N` units still to be graded, `R` points needed. Grade points: A5 B4 C3 D2 E1 F0. Pass floor = E.
| Function | Purpose |
|---|---|
| `DEFAULTS` | scale, passFloor, class thresholds, rounding ('strict'), retake ('add'), maxLoad (24) |
| `inferPoints(units, cgpa)` | exact quality points from a rounded CGPA: `{candidates, exact, conservative}`. Use `conservative` (fewest points) when several fit |
| `requiredPoints(P,Q,N,target,rounding)` | points needed, rounded up |
| `analyze({P,Q,N,target})` | `{verdict, R, requiredAvg, maxPoints, bestCgpa, lowestCgpa, bestClass, lowestClass}`. Verdicts: `safe`, `achievable`, `straightAs`, `impossible` |
| `classOverview({P,Q,N})` | the verdict for every class of degree (Final Semester Mode) |
| `classOf(cgpa)` | class name for a CGPA |
| `planGrades(courses,R,style)` / `planAll(courses,R)` | grade plans. Styles: `balanced`, `fewestA`, `heavy`, `strengths`. Courses: `{units, cap?, floor?, locked?, difficulty?}` (grade points). `planAll` removes duplicate plans and returns `{style,label,grades,points,groups}` |
| `groupPlan(courses,grades)` | counts per unit size, e.g. `{units:3,count:4,mix:'2 A, 2 B'}` |
| `lowestAffordable(courses,R)` | lowest grade each course may take if all others get their best |
| `safeFloor(R,N)` | one grade for every course that still meets the target, or null |
| `aggregateHistory(entries, opening, config)` | P, Q, CGPA from `{id,units,grade,counts?,replaces?}` entries; honours retake policy |
| `whatIf({P,Q,courses,grades,target})` | points, shortfall, projected CGPA |
| `planSemesters({P,Q,semesters:[units],target})` | even split across several remaining semesters |
| `extraUnitsAdvice({P,Q,courses,target,maxLoad,extraCap?})` | would extra units (up to the school maximum) make the target possible? |
| `crossCheck({entries,opening?,school:{cgpa}|{units,points}})` | compare the student's own CGPA with the school's; lists possible reasons for a mismatch |
| `validate({cgpa,units,target,maxLoad,semesterUnits})` | `{ok, errors, warnings}`. Errors block, warnings do not |
| `fmt2`, `letterOf` | formatting helpers |

## State and flow
State shape is in `src/state/store.jsx` (`initialState`). Screens: `welcome → setup → stage → (results →) courses → (courseoptions →) target → result (→ whatif)`. `crosscheck` is a separate branch from Welcome and from the Results idea. Fresh students (`stage: 'fresh'`) skip `results`. Final-semester students (`stage: 'final'`) see the all-classes overview first on `result`. `previous(state)` in `derive.js` returns `{ok, P, Q, ...}` for whichever entry method is active.

**Course options state:** `courseOptions` is an object keyed by the flat course index (0-based, heaviest first, same order as `courseList()`). Each value is `{ status, cap?, floor?, locked?, difficulty? }` where grade values are grade points (integers, e.g. 5 for A). `editingCourseIdx` tracks which course is open in the CourseOptions screen. `courseList()` in `derive.js` enriches each course with these fields before passing to the engine. When a stepper count changes (`setCount`), stale courseOptions beyond the new total are pruned.

**What-if state:** `whatIfGrades` is an array of grade points (one per course in `courseList()` order) passed from the Result screen when the student taps “Try a what-if ›”. The WhatIf screen uses this as the starting point and lets the student adjust grades interactively. All calculations use `E.whatIf`.

**Welcome screen:** shows a “Sign-in is coming soon” amber banner and disables the email/code fields. Captures the browser’s `beforeinstallprompt` event and shows an install banner when the PWA can be installed.

## Defaults and assumptions (confirm with the owner; they are open decisions)
5-point scale with E = 1, pass floor E; class thresholds First 4.50, Second Upper 3.50, Second Lower 2.40, Third 1.50, Pass 1.00; a retaken course keeps the old F in the totals (`retake: 'add'`); strict rounding; school maximum units default 24 (asked in Setup, warn never block).

## Accounts and storage (not built yet): local-first
Planned: passwordless sign-in with a one-time code sent to a school email (allowed domains list). Backend: Firebase (Auth + Firestore). Decision from the owner: **keep most of a signed-in student's data on their phone so the backend stays light and loading is instant.** Design:
- **The device is the working copy; the backend is the durable backup** and the way to move to another phone.
- **Nothing is calculated on the server.** The engine runs on the phone. Plans, verdicts, floors, what-if and cross-check are never stored or sent.
- **What is stored (one compact profile per student, about 1 to 3 KB):** `schemaVersion`, `updatedAt`, `deviceId`, settings (school maximum units, policies), previous results (units + points, or the course-by-course entries with semesters), the last course counts, and the last target. Nothing else.
- **Backend shape:** one Firestore document per student, `users/{uid}`. No per-calculation reads or writes. Expect roughly one read when the app opens and one write after changes settle.
- **On the device:** IndexedDB (wrap it with a tiny helper such as `idb-keyval`). Not `localStorage` (small, synchronous) and not CacheStorage (that is for network responses; the service worker already uses it for the app shell). Call `navigator.storage.persist()` after sign-in to ask the browser not to evict the data.
- **Simplest first version:** enable Firestore's own offline cache (`persistentLocalCache`). It serves reads from the device first and queues writes while offline, with very little code. Only build a hand-written IndexedDB layer if the Firebase SDK size or control becomes a problem.
- **Sync rules:** write to the device immediately on every change; push to the backend debounced (a few seconds after the last change, and when the page is hidden). On open: show the device copy at once, then fetch the backend copy in the background and reconcile. If both changed since the last sync, **ask the student which to keep; never merge silently.**
- **Limits to design for:** browsers can clear site data (notably iOS Safari for sites not installed to the home screen, and on low storage). So the backend stays the source of truth and the app must recover cleanly from an empty device cache.
- **Privacy:** the device copy holds the student's results. Sign-out and delete-account must wipe it. Guest mode never writes to the device. Store no ID numbers or secrets.
- **Code shape:** screens never touch Firebase or IndexedDB directly. Build `src/storage/` with `load()`, `save(profile)`, `clear()` and `subscribeSyncStatus()`, plus a `LocalFirstStorage` implementation; keep an in-memory `GuestStorage` that does nothing durable.
- The Welcome screen already has the email field and says sign-in is coming soon.

## Known gaps
See "Next up" and "Known gaps" in `docs/PROGRESS.md`.
