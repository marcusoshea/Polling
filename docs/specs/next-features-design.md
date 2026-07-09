# Cross-Feature Design Pass: Next 5 Features

Status: **Draft — awaiting sign-off** (design only, no code)
Date: 2026-07-08
Purpose: Lock shared contracts, dependency order, and per-feature approach BEFORE writing individual specs. Individual specs are written just-in-time per feature (reflecting code state after prior features land).

Features:
1. Auto-save drafts while voting
2. Admin dashboard (at-a-glance)
3. PDF/CSV export of reports
4. Accessibility & mobile polish
5. Show a voter their OWN past notes when re-voting

---

## 1. Dependency & conflict map (drives the build order)

| File / area | Touched by | Contention |
|---|---|---|
| `pollings.component.ts` / `.html` (voting screen) | #1, #5, #4 | **HIGH — serialize** |
| `polling-candidate.*` dialog (opens from voting) | #5 | with voting cluster |
| `candidates.component.*` (list responsiveness) | #4 | low |
| `report.component.*` | #3 | isolated |
| `admin.component.*` / new dashboard component | #2 | isolated |
| Backend `polling.*` (new read endpoint) | #5 only | isolated |

**Conclusion:** #2 and #3 are fully independent (different files, no backend). #1/#5/#4 all edit the voting screen → must run sequentially. The shared-contract worry between #1 and #5 turned out **low**: #1 only *writes* (reuses the create endpoint), #5 only *reads* (new endpoint). They share the *screen*, not the *API shape*.

## 2. Recommended build order

Zero-backend independent features first (fast, no contention), then the coupled voting cluster in dependency order:

1. **#3 PDF/CSV export** — self-contained, no backend, libs already installed. Best first win.
2. **#2 Admin dashboard** — independent, no backend. (Safe to run in parallel with #3 — different files.)
3. **#1 Auto-save drafts** — voting cluster start; reuses existing write endpoint.
4. **#5 Own past notes** — needs one small new read endpoint + dialog change.
5. **#4 A11y & mobile polish** — LAST, so ARIA/touch-target work lands on the *final* voting markup (after #1/#5 reshape it). Candidate-list responsiveness can go anytime.

Verify + commit each before the next. #2/#3 may be orchestrated concurrently; the voting cluster is strictly sequential.

---

## 3. Per-feature design

### #3 — PDF export of reports (frontend only)
- **Scope:** **PDF only — CSV is out of scope** (per decision 2026-07-08).
- **Data source:** already bound in `report.component.ts`: `candidateList` (per candidate: `name`, `rating`, `recommended`, `inProcessRating`, `notes[]`) + header metadata (`pollingTitle`, `startDate`, `endDate`, `participationRate`, `certified`, thresholds) + `pollingTotal` (raw Yes/Wait/No/Abstain tallies). **No backend work.**
- **PDF:** use `pdfmake` (installed v0.2.15) — build a `docDefinition` from `candidateList`, or feed report HTML through `html-to-pdfmake` (already `require`d but unused at `report.component.ts:23`).
- **Visibility:** export the *already-filtered* `candidateList`/notes (report already strips private notes for non-admins), so no new privacy logic.
- **UI:** one "Export PDF" button on the report view. Filename from polling title + date.
- **Open decision:** PDF layout — header block (title, dates, participation %, certified), then a per-candidate table (Yes/Wait/No/Abstain, rating %, recommended?); include notes section? admin vs member variants?

### #2 — Admin dashboard (frontend only)
- **Placement:** a **new standalone component** (`admin-dashboard`) rendered at the top of the admin view, NOT more code in the 948-line `admin.component.ts`. Keeps admin lean; matches the trend-chart precedent.
- **Data (all existing endpoints, no backend work):**
  - Active polling status + participation % vs threshold → `getInProcessPollingReport(orderId)` / `getCurrentPolling`.
  - Candidates trending toward/away from the bar → compute rating from in-process `pollingnote/totals` and compare to `polling_order_polling_score`.
  - Members who never vote → `getMissingVotesReport(orderId, count)`.
  - Thresholds (`polling_order_polling_participation`, `polling_order_polling_score`) come from the report response, not storage.
- **Reuse:** the trend-chart's Yes% formula and the report component's rating math are the same (`Yes / (Yes+Wait+No) * 100`) — centralize once if convenient.
- **Open decision:** which 3–4 tiles to show first (recommend: participation gauge, candidate-vs-threshold list, non-voters count, active-polling countdown).

### #1 — Auto-save drafts (frontend; reuses existing write endpoint)
- **Backend:** none. `POST /pollingnote/create` **UPSERTs** by unique key `(polling_id, candidate_id, polling_order_member_id)` — repeated saves update, never duplicate (`polling_notes.service.ts:77-143`). New notes send `polling_notes_id: null`; backend finds-or-creates. So auto-save needs **no** id round-trip.
- **⚠️ Drafts are NEVER counted — Submit stays mandatory (critical UX constraint):** every tally/participation/report query filters `completed = true` (`polling_notes.service.ts:175,187`; `polling.service.ts:300,319,359,455`), and a polling *ending* does NOT auto-promote drafts to submitted. A draft that is never explicitly submitted stays `completed:false` forever and does **not** count when the polling closes. Therefore auto-save must:
  - Write **only** `completed:false` — it must NEVER silently submit a vote.
  - Never lull the voter into thinking a saved draft = a cast vote. Make **draft vs. submitted unmistakable**: a persistent "Draft — not yet submitted" indicator while unsubmitted, and a clear confirmation once `completed:true`.
  - Ideally nudge before close: an "you have unsubmitted drafts" warning while the polling is still open (reuses the existing missing-votes / completed-flag data).
  - Keep the explicit **Submit** action as the only path to `completed:true`.
- **Mechanism:** debounce `ngModelChange` on each row's vote/note/private (~800ms–1.5s pause). Post a **single-row array** `[changedRow]` with `authToken`/`polling_order_member_id` on `body[0]`, `completed: false`. Silent — **no page reload, no alert** (current `submitPolling` does `window.location.reload()`; auto-save must not).
- **Must preserve:** never flip `completed` to `true` on auto-save; honor the admin proxy-voter case (`changeVoter`/`votingMember`); in-flight guard + debounce to avoid races; show a subtle "saving…/saved" indicator.
- **⚠️ Contested claim (adjudicated) — array-body validation:** the create DTO marks `note` (`@IsString @IsNotEmpty`), `vote` (`@IsNumber @IsNotEmpty`), `pn_created_at` (`@IsNotEmpty`) as required. Question: does auto-saving a partially-filled row (no vote / empty note) 400?
  - The verification pass split: an adversarial verifier argued `transform: true` makes `ValidationPipe` validate each array element (→ would 400). **Adjudicated: that is almost certainly wrong.** `ValidationPipe` skips validation when the reflected metatype is a native type, and **`Array` is in that skip list**; `@Body() body: CreatePollingNoteDto[]` reflects as `Array`, so element validation does NOT run without `ParseArrayPipe`/`@Type` (neither present). Empirical proof: the current "Save Draft" already posts empty candidate rows (null vote/empty note) and works in prod — element validation clearly isn't firing.
  - **Action:** confirm empirically at #1 build time with a cheap test (post a one-element array with empty note/no vote through the real pipe; observe 200 vs 400). Do NOT rely on this reasoning alone.
  - **De-risk regardless of the answer:** auto-save should only fire for a row **once it has a vote selected** (also better UX — no value in persisting a truly empty row). This makes #1 correct whether or not validation fires, so it is not a blocker.

### #5 — Show voter's own past notes when re-voting (backend + dialog)
- **Gap found:** `getPollingSummary` already returns and prefills the member's own note for the *current* polling. But past pollings are only reachable via `/polling/allpn/:candidateId`, which for **non-admins strips ALL private notes — including the member's OWN** (`polling.service.ts` member branch adds `t4.private = false`). So a member cannot see their own past private notes. This is the real thing #5 must fix.
- **New endpoint (recommended):** `GET /polling/mynotes/:candidateId` — returns the **requesting member's own** polling notes across pollings for that candidate, member id derived from the JWT (same pattern as the trend endpoint). Privacy-safe: it only ever returns the caller's own notes, so private notes are fine to include. Order-scoped like the trend endpoint.
  - Response per note: `{ polling_id, polling_name, end_date, vote, note, private, completed, pn_created_at }`, ordered by `end_date` DESC.
- **UI:** add a "Your Previous Notes" section to the `PollingCandidate` dialog (opened via `viewCandidate` on the voting screen) — distinct from the existing all-members history. Keep it read-only.
- **Rejected alternative:** modifying `/allpn` to include own private notes — riskier, changes behavior for other consumers (candidate page, trend context).

### #4 — Accessibility & mobile polish (frontend)
- **Baseline (measured):** ~0% ARIA on voting/candidate screens; private checkbox ~16px (WCAG target 44×44); raw `<textarea>`/`<input>` lack `id`/label association; admin proxy `<select>` has a `<label for>` with no matching `id`; vote uses `mat-select` (already accessible); no media queries; 4-column voting table wraps badly < 768px; candidate images have no `alt`.
- **Scope:**
  - Voting controls: associate labels / `aria-label` on note textarea + private checkbox; fix the `label for`/`id` mismatch; ensure ≥44px touch targets via component CSS; consider `mat-form-field`/`mat-checkbox` for built-in a11y.
  - Long lists: responsive handling of the 4-col voting table and the candidate list on small screens (stack or horizontal-scroll container); `alt` on images; visible focus outlines (global `:focus-visible`).
- **Must be LAST for the voting screen** (markup churns in #1/#5). Candidate-list responsiveness is independent and can slot earlier.
- **Verification:** no headless a11y tooling installed; verify via `tsc` + Karma render + manual small-screen check. May add template-level assertions (label presence, aria attributes).

---

## 4. Testing / verification conventions (all features)
- Frontend: `npx tsc -p tsconfig.spec.json --noEmit` + `npx tsc -p tsconfig.app.json --noEmit`; Karma via ChromeHeadless when a browser is available.
- Backend: Jest with **mocked repositories only** — never a live DB connection.
- Production-DB guardrails remain in force: read-only queries, no migrations/synchronize, no server pointed at prod.
- Each feature: its own spec, its own commit, verified green before the next.

## 5. Open decisions to confirm at sign-off
1. Build order as in §2 (start #3, then #2, then #1 → #5 → #4)?
2. #5 via a **new `/polling/mynotes/:candidateId` endpoint** (recommended) vs. changing `/allpn`?
3. #2 as a **new standalone component** at top of admin (recommended) vs. another expansion panel?
4. #3: PDF only (CSV dropped ✓). Confirm PDF layout: header block + per-candidate table; include a notes section, or ratings/recommendation only?
