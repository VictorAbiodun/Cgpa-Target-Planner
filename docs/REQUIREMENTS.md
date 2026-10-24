# Requirements (condensed)

The full document lives in the owner's Claude workspace; this is the version you need to build from.

## Purpose
Tell a Nigerian student what grades they need, course by course, to reach a target CGPA or class of degree. Honest when impossible. Works for every stage of a degree.

## Users and stages
Fresh 100L (no results) · 100L second semester · mid-degree · 400L with one semester still to come · final-semester student (only the current courses left) · 500L+ programmes (semesters left is not fixed at 8) · direct entry or transfer (start at zero or enter opening totals).

## Concepts
Grade point (A5 B4 C3 D2 E1 F0) · units · quality points (units × grade point) · CGPA = total points ÷ total units · pass floor (lowest passing grade, default E) · locked course (grade already known) · class thresholds (First 4.50, Second Upper 3.50, Second Lower 2.40, Third 1.50, Pass 1.00; editable, confirm per school).

## Maths
`R = ceil(T × (P + N) − Q)` (T target). Required average = R ÷ N. Best possible CGPA = (Q + N×5) ÷ (P + N). Verdicts: `R ≤ N×floor` → safe; `R > N×max` → impossible; `R = N×max` → straight As only; otherwise achievable. A rounded CGPA like 3.80 on 90 units fixes the points at 342 because points are whole numbers; if several totals fit, use the fewest points (cautious) and prompt for exact points.

## Entering results (three methods)
A. Summary: total units + CGPA. B. Exact points: units + total quality points (TCP). C. Course by course: pick units, then grade; no names needed; optional semester grouping; live totals and CGPA; optional opening balance (not built yet); retake and zero-unit flags (not built in the UI yet; engine supports them).

## Courses to plan for
Added by unit size with steppers; names optional; same-unit courses are interchangeable so results are shown as counts per unit size. Optional per-course limits (highest realistic grade, lowest acceptable grade, difficulty 1 to 5, already graded). Remaining semesters and estimated units for later semesters (not built yet).

## Target
A CGPA number, a class of degree, or "Best I can do".

## Results
Verdict and required average · four plan styles (Balanced, Fewest As, Heavy first, My strengths) with duplicates removed · per-unit guidance: **Aim** (from the chosen plan) and **Floor** (lowest affordable grade if all others get their best; spare points are shared) · optional single safe floor · Final Semester Mode (every class with its verdict, best and lowest possible CGPA) · what-if (not built) · share (not built).

## School maximum units and the extra-units tip
Setup asks the school's maximum units per semester (default 24, whole number ≥ 1). When a target is impossible or only possible with straight As, the app tries +1, +2, … extra units up to the maximum (assuming the extra courses can score a top grade; adjustable) and shows the fewest extra units that help and the average needed. Not shown when the target is below the current CGPA or there is no headroom. If nothing unlocks it, show the best possible CGPA at the maximum load. Always warn that extra units are an estimate and may need approval.

## Cross-check
Student enters results course by course (optionally by semester) and the school's CGPA, or the school's exact units and points. Show calculated units, points, CGPA, GPA per semester and running CGPA, and Match / Close (≈ rounding or cut-off) / Does not match with the gap. On a mismatch, list explanations that reproduce the school's number: cut-off instead of rounding, retake policy the other way, zero-unit courses counted, one grade different, a missing course, an extra course. These are possibilities, not certainties. "Use these results for my plan" carries the entries into the planner.

## Accounts
Two choices on the first screen: sign in with a school email (passwordless one-time code, supported school domains only; saved data restored on any device) or continue as a guest (nothing saved; warn before leaving; offer to sign in or share). Guest-to-signed-in: ask whether to save current entries; never merge silently. Delete account removes all data, on the server and on the device. Storage is local-first: a signed-in student's compact profile is kept on the phone and synced to the backend in the background, so opening the app is instant and the backend stays light (see AGENTS.md, "Accounts and storage"). Privacy notice and consent before the first account. Check the Nigeria Data Protection Act (2023) with a qualified person before launch.

## Edge cases to keep working
Fresh 100L with no data · final semester only · 400L with a semester to come (estimates) · 5-year programmes · direct entry/transfer · partly graded semester · carryovers and retakes (policy setting) · withdrawn/absent/withheld results (treat as pending) · zero-unit/non-credit courses · target already met · target impossible · target needs straight As · per-course caps · inconsistent input (CGPA above 5, CGPA > 0 with 0 units, negatives) · unit load above the school maximum (warn only) · rounded CGPA ambiguity · guest closes the page · sign-in without internet.

## Non-functional
Mobile-first PWA, works offline after first load (guest mode makes no server calls), plans in under a second on a low-end phone, small download, accessible (44px targets, contrast, focus, live regions), English, whole-number maths, no analytics that identify a student.

## Open decisions (ask the owner; defaults are in AGENTS.md)
1. Grading scale and letters at Redeemer's, score ranges. 2. Class thresholds. 3. Retake policy (keep or replace the old F). 4. Maximum units and overload rules. 5. Total units to graduate per programme. 6. SIWES and final project units and whether they count in CGPA. 7. Whether the school rounds CGPA before classifying. 8. Launch audience (Redeemer's only or all Nigerian universities). 9. Which school email domains to support. 10. Sign-in method (code or magic link). 11. Backend and hosting responsibility and cost. 12. Data retention after graduation. 13. Another sign-in route for schools without student emails.

## Test cases
All worked examples are in `src/engine/engine.test.js` (T1 to T16 from the original spec plus the extra-units and cross-check cases). Keep them passing.
