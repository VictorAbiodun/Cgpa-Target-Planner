# Visual design spec

The designer (the owner) built screens in Figma, but **you cannot open Figma**. This document describes every screen precisely so you can recreate the look. When the code and this document disagree, follow this document, then tell the user. Tokens already live in `src/styles.css`.

## 1. Feel
Clean, minimal, calm, trustworthy. Lots of white. One green accent. Rounded corners everywhere. Big friendly type. No gradients on screens, no illustrations, no stock photos. Motion is subtle and quick. It should feel like a premium finance or study app, not a spreadsheet.

## 2. Tokens
| Token | Value | Use |
|---|---|---|
| `--g` | #0F7A55 | accent green: primary buttons, selected borders, positive text, progress |
| `--ink` | #14201B | main text |
| `--mut` | #5B6B64 | secondary text, hints, labels |
| `--line` | #D5E0DA | borders, dividers, inactive progress bars |
| `--tint` | #E8F5EF | selected backgrounds, positive cards |
| `--grey` | #F3F6F4 | neutral cards (totals, banners) |
| `--red` / `--red-tint` / `--red-line` | #B3402F / #FBEDEA / #F0C9C2 | impossible / error |
| `--amb` / `--amb-tint` | #8A5A00 / #FFF3D6 | straight As only / warnings / "changed" |
| page background (desktop) | #EEF3F0 | outside the phone column |
| app surface | #FFFFFF | screens |

**Font:** Manrope (400, 600, 700), fallback system-ui. Body 15px. Page titles 26px bold (Welcome title 30px). Subtitles 15px in `--mut`. Small notes 13px. Big numbers 34px bold (verdict) and 28px (stat cards).
**Spacing:** screen side padding 20px; vertical gap between blocks 16px; card padding 16px; inside-card gaps 12px.
**Radii:** buttons 12px, chips 10px, cards and option cards 14px, pills 999px, segmented control 12px (inner 9px), phone-style app container 28px on desktop.
**Borders:** 1.5px `--line` on cards, chips and inputs. Selected = border `--g` plus `--tint` background.
**Touch targets:** at least 44px high (buttons 48px).
**Layout:** a single column, max width 430px, centred. On screens wider than 520px it floats as a rounded card with a soft shadow on the pale page background. Primary button is pinned at the bottom of the screen (sticky footer) with a white fade above it. Respect iOS safe-area insets.
**Motion:** a new screen slides in from the right (18px) while fading in, 0.35s ease-out. New list items pop in (scale from 0.7). Result group cards rise in with an 80ms stagger. Buttons shrink to 98% on press. All motion off under `prefers-reduced-motion`.

## 3. Components
- **Header (steps 1 to 5):** a row with a grey "‹ Back" text button on the left (44px high) and "Step n of 5" in 13px grey on the right. Under it, five 4px rounded bars with 6px gaps; the first n are green, the rest `--line`.
- **Title block:** 26px bold title, 6px gap, 15px grey subtitle.
- **Primary button:** full width, 48px, green fill, white 16px semibold text, radius 12. **Secondary:** white, 1.5px `--line` border, dark text. **Link button:** no border, green bold text, 44px high. **Danger link:** red text. Disabled = 45% opacity.
- **Chip:** equal-width buttons in a row with 8px gaps, 44px high, radius 10, 1.5px border; selected = green border, `--tint` fill, green text. Rows: Units 1 to 6; Grade A to F.
- **Option card:** full-width button, left-aligned, padding 16, radius 14, bold 16px title and 14px grey subtitle stacked with 4px gap. Selected = green border + `--tint`.
- **Segmented control:** a bordered rounded track (padding 4) of equal buttons, 44px high, 13px semibold; the active one is solid green with white text.
- **Field:** 14px semibold label above a 48px input (radius 12, 1.5px border, 16px text). Hint = 13px grey below. Error = 13px red semibold below, input border red.
- **Card:** padding 16, radius 14, 1.5px border, 12px inner gap. Tones: `tint` (green wash), `bad` (red wash), `warn` (amber wash), `grey` (no border).
- **Pill:** rounded label, 13px semibold. Kinds: ok (green on tint), safe (dark on grey), bad (red on red-tint), warn (amber on amber-tint).
- **Entry pill (added course):** green-on-tint pill reading "3 units · A" with a round ✕ remove button inside (44px tall touch area).
- **Totals bar:** grey rounded bar with three columns: small grey label over a 20px bold number (Units, Points, CGPA so far in green).
- **Stepper row:** label "3-unit courses" (semibold) on the left; on the right a 44px square "−" button, a bold 18px count, and a 44px square "+" button with a green border and green plus. Rows are separated by a 1px line.
- **Result group card:** bordered card; left: bold "4 courses · 3 units" and a 13px grey "Aim: " followed by green bold "2 A, 2 B"; right-aligned: tiny grey "Floor" over a 20px bold grade letter.
- **Banner:** grey rounded bar, 13px grey text ("Guest mode: nothing is saved.").

## 4. Screens
Wireframes are 390px wide. `[ ]` is a button or input. Everything is left-aligned unless stated.

### 4.1 Welcome (built)
No header. Content is vertically centred.
```
            (logo: green ring with a solid green dot, 44px)
  CGPA Target Planner                       <- 30px bold
  Know the grade you need in every course.  <- 16px grey
  School email
  [ name@yourschool.edu.ng            ]
  [        Send me a code             ]     <- primary
  We email a one-time code. No password needed.   <- 13px grey
  ------------------ or ------------------
  [  Continue without signing in  ]         <- secondary
  Guest mode: nothing is saved.
            Just cross-check my CGPA        <- green link
```
"Send me a code" currently only shows "Sign-in is coming soon. You can continue as a guest for now." (see PROGRESS.md for the real flow). Guest button goes to Setup.

### 4.2 Setup (built; not in the original Figma)
Back button only, no step bars. Title "Your school", subtitle "One quick question so the advice fits your school." One number field "Most units your school allows in one semester" (default 24, whole number 1 to 60) with hint "Most schools allow around 24. We use this to tell you if a few extra units could put your target within reach." A grey card explains the 5-point scale. Continue button pinned at the bottom.

### 4.3 Stage (built)
Header step 1. Title "Where are you in your degree?" Subtitle "This decides what we ask next." Three option cards: "I have no results yet" / "Fresh 100 level, nothing graded"; "I have results from earlier semesters" / "Add them by CGPA, points, or course by course"; "This is my final semester" / "Only these courses are left". Continue (disabled until one is chosen). Fresh goes straight to Courses; the others go to Results.

### 4.4 Results so far (built)
Header step 2. Title "Your results so far". Segmented control: **Summary | Exact points | Course by course** (default Course by course).
- *Course by course:*
```
  [Summary][Exact points][ Course by course ]
  +----------------------------------------+
  | Units   [1][2][3][4][5][6]             |
  | Grade   [A][B][C][D][E][F]             |
  | [            Add course             ]  |
  +----------------------------------------+
  (3 units · A ✕) (3 units · B ✕) (2 units · C ✕)
  +----------------------------------------+
  | Units   Points   CGPA so far           |
  |  14      61        4.36 (green)        |
  +----------------------------------------+
  [              Continue              ]
```
- *Summary:* two fields "Total units so far" and "CGPA"; below, a green tint box showing the worked-out points ("342 points") with a note ("Worked out from your units and CGPA.", or if several totals fit: "Several totals fit your CGPA, so we use the cautious one. Use Exact points for a precise plan.").
- *Exact points:* fields "Total units so far (TNU)" and "Total quality points (TCP)" (hint "Many transcripts print this next to your CGPA."); below, a green tint box "CGPA 3.80".
Continue is disabled until the entries are valid. Invalid input shows a red error under the field.

### 4.5 Courses (built)
Header step 3. Title "Courses to plan for", subtitle "Add by unit size. Names are optional." (fresh students: "Add the courses you are registered for this semester. Names are optional."). Six stepper rows "1-unit courses" to "6-unit courses". Below, a green tint box: "20 units across 7 courses". If the total is above the school maximum the box turns amber and adds "That is above the 24-unit maximum you entered. You can still continue." Continue disabled at 0 units.
Planned (not built): a green link "Set grade limits for a course ›" opening Course options (4.10).

### 4.6 Target (built, three variants)
Header step 4. Title "Your target", subtitle "Pick a target for your upcoming exams, or see the best you can do." Segmented control **CGPA | Class of degree | Best I can do**.
- *Class of degree (default):* three option cards: First Class "4.50 and above", Second Class Upper "3.50 and above", Second Class Lower "2.40 and above", plus a grey callout explaining that the target is for upcoming exams to climb toward their degree. Button "See my plan".
- *CGPA:* a card with a "Target CGPA" field, hint "The CGPA to aim for after your upcoming exams (5.0 scale).", a grey callout box ("Target for upcoming exams, not graduation: This is a target for the exams you’re about to write, not your final graduation CGPA. Your result and recommended grades are planned for these upcoming courses to help you climb steadily toward your desired CGPA."), a "Quick picks" label and four chips 4.50, 4.00, 3.50, 3.00.
- *Best I can do:* a green tint card, green bold "No target needed", text "We skip the target and show the highest CGPA you can still reach, with the grades that get you there." Button "Show my best result".

### 4.7 Result (built, several states)
Header step 5. One verdict card at the top, then content. Footer: grey banner "Guest mode: nothing is saved.", secondary button "Try a different target", green link "Start over".
- **Achievable:** green tint card, green pill "Achievable", 34px bold "4.6 average", grey text "needed across your 20 units to reach First Class. That is 92 of 100 possible points. Best possible CGPA: 4.74." Then plan tabs (equal-width bordered buttons, active = green border/tint/text): Balanced, Fewest As, Heavy first, My strengths (duplicates are hidden). Then one result group card per unit size. Then the 13px note "Floor is the lowest grade in one course if you get A in the rest. Spare points are shared."
- **Impossible:** red tint card, red pill "Impossible", 34px bold "First Class is out of reach", text "You would need an average of 6.5 across your 20 units, and the maximum is 5.0. Your best possible CGPA is 4.25, which is Second Class Upper." Then a heading "What you can still reach" and rows (title "Best possible · 4.25" style, grey subtitle, pill on the right) for the classes that are still possible. Then the **extra-units tip** (below).
- **Straight As only:** amber card, amber pill, "An A in every course", text "That is the only way to reach First Class with 20 units. Best possible CGPA: 4.25." Plan groups show all A. Extra-units tip shown.
- **Already safe:** green card, pill "Already safe", "You are on track", text "You reach … as long as every course is passed. Lowest possible CGPA: … Best: …".
- **Best I can do:** green card, pill "Your best result", "4.74 CGPA", text "Second Class Upper. You get there with an A in every course (20 units)." plus the two stat cards from 4.8.
- **Extra-units tip card (green tint):** heading "Could a few extra units help?"; text "Your target is out of reach with 20 units. With **2 more units** (22 of a 24-unit maximum) it becomes …" followed by a short list "+2 units: straight As", "+3 units: average 4.96"…; or, if nothing unlocks it: "Even at the school maximum of 24 units, the best possible CGPA is **4.27**, so this target stays out of reach." Always ends with the 13px grey note "Extra units are an estimate: you would need real courses where you can score high. Some schools need approval for extra courses, so check with your department." Only shown when extra units can help (target above the current CGPA and there is room under the maximum).

### 4.8 Final semester mode (built; shown first when Stage = final semester)
Header step 5. A small grey pill "Final semester mode". Title "Your last courses", subtitle "Every class of degree and what it takes with your 20 remaining units." Two stat cards side by side: left green tint "Best possible / 4.00 (28px bold green) / Second Class Upper", right grey "Lowest if you pass all / 3.33 / Second Class Lower". Then a bordered list of rows, one per class of degree: bold "First Class · 4.50", grey subtitle ("Needs 160 points, only 100 available" / "Needs an average of 2.0 across 20 units" / "Needs an A in every course" / "Met if every course is passed"), and a right-aligned pill (Impossible red, Achievable green, Straight As only amber, Already safe grey). Rows that are still possible are tappable and open that class's plan. Closing note "Tap a class to see the grades it needs. Classes marked Impossible can no longer be reached."

### 4.9 Cross-check (built; not in the original Figma)
No step bars (Back button only). Title "Cross-check your CGPA", subtitle "Enter your results and compare the CGPA we calculate with your school’s." A card with Units chips, Grade chips, primary "Add course", and two small secondary buttons side by side: "Undo last" and "Start new semester". Entries are shown under a small heading per semester ("Semester 1") as entry pills. A totals bar (Units, Points, Our CGPA). Heading "Your school’s figure", segmented control **CGPA | Units and points** and the matching field(s) (units-and-points hint: "Most precise: units and points leave no room for rounding."). Once there are entries and a valid school figure: a comparison card (green for Match, amber for Close, red for Does not match) with a pill, a one-line verdict, the difference, and a "Possible reasons" bullet list (cut-off instead of rounding, retake policy, one grade differs, a missing course, an extra course) ending "These are possibilities, not certainties. Check your result slip." If there is more than one semester, a small table of semester GPA and running CGPA. Pinned button "Use these results for my plan" carries the entries into the planner (goes to Courses).

### 4.10 Screens designed in Figma but NOT yet built
Build these in this order of value (see PROGRESS.md).
- **Course options** (header step 3): title "Course options", subtitle "Optional. Set limits for one course." A card titled e.g. "Course 1 · 4 units" with a segmented control (To be graded | Already graded | Retake), then three labelled chip rows: "Highest grade I can realistically get" (A to E), "Lowest grade I will accept" (A to E), "How hard is it for me? (1 easy, 5 hard)" (1 to 5). A tint hint "Plans will keep this course between C and B." Pinned "Save course". The engine already supports `cap`, `floor`, `locked`, `difficulty`.
- **What-if** (header step 5): title "What if?", subtitle "Change a grade and watch your CGPA update." A grey card: left "Projected CGPA" label over a 34px bold number, right a pill ("Meets First Class" green / "Below First Class (4.50)" red); a thin 8px progress track (green full when on target, amber partly filled when short); a bold 13px line "89 of 92 points needed. 3 points short." Then one row per course ("Course 1 · 4 units" left, a 56px wide grade chip right; a changed grade turns amber). Note "Amber means you changed it from the plan. Spare points are shared across courses." Secondary "Reset to plan". Use `E.whatIf`.
- **Share preview** (header step 5): title "Share your plan", subtitle "This is the image your friends will see." A rounded bordered card with a green band "CGPA Target Planner", then "Target / First Class · 4.50", big green "4.6 average", "needed across 20 units", a divider, three rows ("One 4-unit course … A", "Four 3-unit courses … 2 A, 2 B", "Two 2-unit courses … 1 A, 1 B") and a grey "Made with CGPA Target Planner". Buttons "Share image" (primary) and "Copy as text" (secondary). Use the Web Share API where available.
- **Enter code** (no step bars): title "Check your email", subtitle "We sent a 6-digit code to name@yourschool.edu.ng. It expires in a few minutes." Six boxes (56px high, radius 12, 24px bold digit; the active box has a 2px green border), a green "Resend code" link, pinned "Verify" and a grey "Use a different email" link. After success show a full-screen overlay: green circle with a check, bold "Saved to your account", grey "Your results are here next semester. Add only the new ones."
- **Guest warning:** a bottom sheet over the dimmed screen (45% black scrim): grab handle, bold 20px "Leave without saving?", grey text "You are in guest mode, so nothing is saved. If you leave now, you will need to enter everything again.", primary "Sign in to keep this", secondary "Share my plan first", red text link "Leave anyway". Shown when the student presses Back from the Result screen in guest mode.
- **Lower priority:** privacy and consent, "save guest entries to account / which version to keep", school and grade-scale setup, remaining semesters and estimated units, multi-semester split (`E.planSemesters`), settings home, grade scale and thresholds, account and data (sign out, delete account), input error states, sign-in problems (no internet, wrong code, delayed code), empty course list.

## 5. Voice and copy rules
Friendly, direct, no jargon. Say "units" and "points", not "credit hours" or "quality point average". State the bad news plainly then show what is still possible ("First Class is no longer reachable. Second Class Upper is still in your hands."). Use the typographic apostrophe ’ in visible text. Numbers: CGPA always two decimals (4.36); required average one decimal (4.6).
