# Spec: Feature #5 — Show a Voter Their Own Past Notes

Status: **Approved — building**
Parent design: [next-features-design.md](next-features-design.md)

## 1. Summary
When a voter opens a candidate from the voting screen, show them **their own** past polling notes/votes on that candidate (across all pollings), so they have continuity when re-voting. Adds a small **read-only backend endpoint** + a "Your Previous Notes" section in the candidate dialog.

## 2. The gap this closes
The candidate dialog's existing "Polling Notes" section uses `GET /polling/allpn/:candidateId`, which for non-admins filters `private = false` — so it **hides the member's own private past notes from them**. A member can't see their own prior private notes to keep continuity. The fix returns the member's own notes (including their own private) via a member-scoped endpoint.

## 3. Backend — new endpoint (read-only)

**`GET /polling/mynotes/:candidateId`**, guard `JwtAuthGuard`. Mirror the existing `getCandidateTrend` pattern (`polling.controller.ts` / `polling.service.ts`): controller passes the `authorization` header to the service.

- Derive the requesting member id from the JWT: `authService.getPollingOrderMemberId(authToken)`.
- Order-scope like the trend endpoint: `authService.getPollingOrderId(authToken)`; confirm the candidate's `polling_order_id` matches — if not, return `[]` (no cross-order leak).
- Query the member's **own** notes for the candidate across pollings:
  - `PollingNotes` INNER JOIN `Polling`, where `candidate_id = :candidateId` AND `polling_order_member_id = :memberId` AND `completed = true`.
  - **No `private = false` filter** — these are the caller's own notes, so returning their own private notes is safe and is the whole point.
  - Order by `end_date` DESC.

**Response (contract)** — array, newest polling first:
```jsonc
[
  { "polling_id": 12, "polling_name": "Spring AS 59 Polling", "end_date": "2026-04-30T00:00:00.000Z",
    "vote": 1, "note": "Strong progress", "private": false, "completed": true,
    "pn_created_at": "2026-04-10T..." }
]
```
`vote` is numeric (1=Yes,2=Wait,3=No,4=Abstain), matching the existing dialog's `[ngSwitch]` display. `note` may be null.

**Safety:** production DB — SELECT only, no migration/synchronize, verify with mocked-repo Jest only. Never start a server against prod.

## 4. Frontend

### Service
Add to `NotesService`: `getMyPollingNotesByCandidateId(candidateId: number, accessToken: string): Observable<PollingNote[]>` → `GET {apiUrl}/polling/mynotes/{candidateId}` with the same Bearer-header pattern as `getPollingNoteByCandidateId`.

### Dialog (`PollingCandidate` in pollings.component.ts + polling-candidate.html)
- In the constructor, also call `getMyPollingNotesByCandidateId(candidate_id, accessToken)`; group by polling name exactly like the existing all-members block: `myPollingNames` (unique, sorted by end_date DESC) + `myPollingNotes` (array of arrays).
- Render a **"Your Previous Notes"** section as the **first** section of the dialog (above the existing all-members "Polling Notes" accordion), so the voter sees their own history first. Reuse the existing markup style (mat-accordion, one panel per polling name; per note show the vote via the existing `[ngSwitch]` 1→Yes/2→Wait/3→No/4→Abstain, the note text, and a `--PRIVATE RESPONSE--` marker when `private`). Since these are all the member's own notes, no author name line is needed (or label it "you").
- Empty state: if the member has no past notes on this candidate, show a muted "You have no previous notes on this candidate." (or omit the section).

### Note on overlap
The member's own **non-private** notes will appear both here and in the existing all-members "Polling Notes" section — acceptable minor redundancy; "Your Previous Notes" is the voter's dedicated continuity view and is the only place their own **private** history shows.

## 5. Testing
- **Backend (Jest, mocked repo):** returns only the requesting member's notes; includes their private notes; only `completed = true`; ordered end_date DESC; cross-order candidate → `[]`; derives member id from the token (not a param).
- **Frontend (Karma):** `getMyPollingNotesByCandidateId` issues the correct GET URL + auth header; the dialog groups notes by polling name into `myPollingNames`/`myPollingNotes`; empty response → empty state. Match existing dialog test style.
- Type-check both `tsconfig.spec.json` + `tsconfig.app.json`; backend `npx tsc --noEmit`. Full frontend suite stays green (currently 118).

## 6. Files touched
**API (`Polling-API`)**
- `src/polling/polling.controller.ts` — add `GET /mynotes/:candidateId`.
- `src/polling/polling.service.ts` — add `getMyNotesByCandidateId(candidateId, authorization)`.
- `src/polling/polling.service.spec.ts` — tests.

**Frontend (`Polling`)**
- `src/app/services/notes.service.ts` — add `getMyPollingNotesByCandidateId`.
- `src/app/pollings/pollings.component.ts` — `PollingCandidate`: fetch + group `myPollingNames`/`myPollingNotes`.
- `src/app/pollings/polling-candidate.html` — add "Your Previous Notes" section at top.
- specs updated.

## 7. Contract (for parallel build)
`GET /polling/mynotes/:candidateId` → `[{ polling_id:number, polling_name:string, end_date:string, vote:number, note:string|null, private:boolean, completed:boolean, pn_created_at:string }]`, member-scoped (JWT), order-scoped, completed-only, end_date DESC.
