# Spec: Feature #4 — Accessibility & Mobile Polish

Status: **Approved — building** (mat-checkbox, horizontal-scroll wrapper, 375px target; confirmed 2026-07-08)
Parent design: [next-features-design.md](next-features-design.md)

## 1. Summary
Improve accessibility and small-screen usability of the **voting screen** and the **candidate list**, since voting happens on phones. Frontend-only (templates + CSS, minimal logic). Conservative changes — no behavior changes to voting/auto-save/submit, no mat-table restructure.

## 2. Baseline (measured earlier)
- Voting controls: vote `<mat-select>` (built-in a11y but no label, only a `placeholder`), note `<textarea>` and private `<input type=checkbox>` are raw with **no `id`/label/`aria-*`**; the admin proxy `<select>` has a `<label for="pollingOrder">` but the select has **no matching `id`**.
- Private checkbox ~16px (WCAG target 44×44); buttons ~48px (ok).
- ~0% ARIA on pollings/candidates screens; candidate `<img>` have no `alt`.
- `.form-control:focus` has no visible focus indicator (no outline change).
- No media queries in component CSS; the 4-column voting table and candidate list don't adapt on small screens.
- `index.html` already has a correct viewport meta + `lang="en"` (good — leave alone).

## 3. Scope

### In scope
**A. Labels / ARIA on voting controls** ([pollings.component.html](../../src/app/pollings/pollings.component.html))
- Note `<textarea>`: add `[attr.aria-label]="'Note for ' + element.name"` and a unique `[id]`. (Keep the existing `(ngModelChange)="onRowChange(element)"` from #1 intact.)
- Vote `<mat-select>`: add `[attr.aria-label]="'Your vote for ' + element.name"`.
- Private checkbox: convert to **`<mat-checkbox>`** with an accessible label ("Private for {{element.name}}") — gives a proper label + larger target for free, and still supports `[(ngModel)]` + `(ngModelChange)="onRowChange(element)"`. (Import `MatCheckboxModule`.) If mat-checkbox proves risky, fallback: keep the raw input but add `[attr.aria-label]` + a wrapping `<label>` + CSS to enlarge the hit area.
- Fix the admin proxy `<select>`: add `id="pollingOrder"` (matching its existing `<label for>`), or an `aria-label`.
- Add `scope="col"` to the voting table header cells.

**B. Visible focus indicator** (global [styles.css](../../src/styles.css))
- Add a `:focus-visible` outline rule (e.g. `2px solid` in a high-contrast color from the CSS vars) so keyboard focus is visible on inputs/links/buttons. Do not remove existing styling; just add the outline on focus-visible.

**C. Touch targets**
- Ensure the vote control, note field, and private control have ≥44px interactive height on small screens (mat-checkbox helps; add minimal CSS for the others if needed). Buttons already pass.

**D. Images** ([polling-candidate.html](../../src/app/pollings/polling-candidate.html), [candidates.component.html](../../src/app/candidates/candidates.component.html))
- Add `[alt]` to candidate `<img>` (e.g. `[alt]="'Image of ' + candidateName"` / candidate name), so they're not unlabeled.

**E. Small-screen layout (safe, no mat-table redesign)**
- Wrap the voting table and the candidate-list table in a horizontally-scrollable container (`style="overflow-x:auto"` / a `.table-responsive` wrapper) so wide tables don't break the mobile layout.
- Reduce oversized padding (`p-4` → responsive) on the voting cells at small breakpoints via a media query in `pollings.component.css`, so controls fit better on phones.
- Search/filter inputs (candidates filter; any voting-screen filter): add an associated label or `aria-label`.

### Out of scope (flag, don't attempt now)
- Full responsive **stacking** redesign of the mat-tables (card-per-row on mobile) — higher risk; defer to a follow-up if the scroll-wrapper isn't enough.
- Converting every raw control across the whole app to Material.
- Adding an automated a11y tool (axe) / new dev deps.
- Admin screen a11y (separate, large surface).

## 4. Targets
- WCAG 2.1 AA-oriented: labelled form controls, visible focus, ≥44px targets where feasible, images have alt.
- Zero behavior change: auto-save, submit, draft banner, "Your Previous Notes", proxy voting all work exactly as before.

## 5. Testing / verification
- **Karma:** template-level assertions where cheap — e.g. the note field/vote select expose an `aria-label`; the private control renders with an accessible name; candidate `<img>` has a non-empty `alt`. Keep existing tests green.
- **Type-check:** `tsconfig.spec.json` + `tsconfig.app.json` → exit 0. Full suite stays green (currently 124).
- **Manual (the real a11y check):** load the voting screen at a narrow width (e.g. 375px) — controls usable, table scrolls/fits, tab-through shows visible focus, VoiceOver/screen-reader reads a label for each vote/note/private control. (No headless a11y tooling in the repo, so this manual pass is the acceptance gate.)

## 6. Files touched (frontend only)
- `src/app/pollings/pollings.component.html` — aria-labels, mat-checkbox, proxy select id, header scope, scroll wrapper.
- `src/app/pollings/pollings.component.ts` — import `MatCheckboxModule` (if used).
- `src/app/pollings/pollings.component.css` — small-screen padding/touch-target media query.
- `src/app/pollings/polling-candidate.html` — img alt.
- `src/app/candidates/candidates.component.html` — img alt, filter label, scroll wrapper.
- `src/styles.css` — `:focus-visible` outline.
- specs updated as needed.

## 7. Open decisions
1. Private checkbox → **mat-checkbox** (recommended, proper a11y) vs. keep raw input + aria-label/CSS?
2. Small-screen tables: **horizontal-scroll wrapper** now (recommended, low risk) vs. invest in full card-stacking?
3. Any specific device/width you want me to target for the manual pass (default: 375px iPhone SE)?
