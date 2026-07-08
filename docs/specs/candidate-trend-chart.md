# Spec: Candidate Readiness Trend Chart

Status: **Draft — awaiting approval**
Author: (spec-driven, multi-agent build)
Date: 2026-07-08

## 1. Summary

Candidates in an SCA polling order are polled repeatedly over months. Today the
Candidates detail view shows each candidate's historical polling notes grouped by
polling, but there is no at-a-glance sense of **momentum** — whether readiness is
trending up or down over successive pollings.

This feature adds an inline line chart to the **Candidate detail view** on the
Candidates page, plotting the candidate's **Yes% rating** for each polling in which
they appeared, ordered chronologically. Readiness trending up toward the order's
recommendation bar is exactly what these orders assess.

## 2. Goals / Non-goals

**Goals**
- Inline line chart on the Candidates page candidate-detail view (the `candidateSelected` section).
- One point per polling the candidate was included in, ordered by polling `end_date` ascending.
- Y axis = Yes% rating; X axis = polling (labeled by polling name / end date).
- Accurate for **all** members, including when votes carry private notes.

**Non-goals (this iteration)**
- No recommendation-threshold overlay line (chose "Yes% rating only").
- No stacked vote-composition chart.
- No charts on the Report page or in the voting (Pollings) view.
- No new admin controls, export, or date-range filtering.

## 3. Metric definition

Per polling, over that candidate's **completed** votes:

```
rating = Yes / (Yes + Wait + No) * 100      (rounded to 2 decimals)
```

Abstain and Null votes are excluded from the denominator. This matches the existing
report formula in `report.component.ts`
(`positive / (participatingMembers - abstain) * 100`), where
`participatingMembers - abstain == Yes + Wait + No`.

A polling with zero eligible votes (only Abstain/Null, or no votes) yields `null`
rating and is rendered as a gap (no point), not `0`.

## 4. Data source — the one real decision

### Problem with reusing the existing endpoint
`GET /polling/allpn/:id` (frontend `NotesService.getPollingNoteByCandidateId`) already
returns a candidate's polling notes across pollings. **But for non-admin members its
query adds `AND t4.private = false`, which drops entire note rows — including their
votes.** Computing a rating from that would understate/skew the rating for members
whenever any voter attached a private note, disagreeing with the official report.

### Chosen approach: new aggregate endpoint (privacy-safe + accurate)
Add a backend endpoint that returns **per-polling vote counts only** (no note text).
Because it returns counts, not note content, it can safely include private-note votes
for every caller without leaking anything, and it is one lightweight call.

**Endpoint:** `GET /polling/candidatetrend/:candidateId`
**Guard:** `JwtAuthGuard`. Verify the candidate's `polling_order_id` matches the
requester's polling order (from the JWT) — return 404/empty if not, to prevent
cross-order enumeration.
**Visibility window:** Do **not** apply `polling_order_notes_time_visible`. That
setting governs note *text* visibility; aggregate counts are not note content and the
trend's value is showing full history. (Decision — confirm at approval.)

**Response shape (contract):** array ordered by `end_date` ASC:
```jsonc
[
  {
    "polling_id": 12,
    "polling_name": "Spring AS 59 Polling",
    "end_date": "2026-04-30T00:00:00.000Z",
    "yes": 8,
    "wait": 2,
    "no": 1,
    "abstain": 3,
    "total": 14,            // count of completed notes for this candidate/polling
    "rating": 72.73         // Yes/(Yes+Wait+No)*100, or null if denom == 0
  }
]
```
`rating` MAY be computed server-side (preferred, single source of truth) or client-side.
This spec computes it **server-side** so the frontend just plots `polling_name` vs `rating`.

**Query sketch (TypeORM raw / SQL):**
```sql
SELECT p.polling_id, p.polling_name, p.end_date,
  SUM(CASE WHEN pn.vote = 1 THEN 1 ELSE 0 END) AS yes,
  SUM(CASE WHEN pn.vote = 2 THEN 1 ELSE 0 END) AS wait,
  SUM(CASE WHEN pn.vote = 3 THEN 1 ELSE 0 END) AS no,
  SUM(CASE WHEN pn.vote = 4 THEN 1 ELSE 0 END) AS abstain,
  COUNT(pn.polling_notes_id) AS total
FROM "PollingNotes" pn
INNER JOIN "Polling" p ON pn.polling_id = p.polling_id
WHERE pn.candidate_id = :candidateId AND pn.completed = true
GROUP BY p.polling_id, p.polling_name, p.end_date
ORDER BY p.end_date ASC
```
Rating is derived from the counts after the query (guard divide-by-zero → null).

## 5. Frontend design

### Library
Add `chart.js` + `ng2-charts` (ng2-charts v8 supports Angular 19). Register via the
standalone `provideCharts(withDefaultRegisterables())` provider in the
**`bootstrapApplication` providers array in `src/main.ts`** (NOT `app.config.ts` —
this app bootstraps with an inline providers list and does not use `appConfig`), and
import `BaseChartDirective` directly into the chart component. Component `.spec.ts`
TestBeds must also include `provideCharts(withDefaultRegisterables())` or the chart
throws `"linear" is not a registered scale`.

### New interface
`src/app/interfaces/candidate-trend.ts`
```ts
export interface CandidateTrendPoint {
  polling_id: number;
  polling_name: string;
  end_date: string;
  yes: number;
  wait: number;
  no: number;
  abstain: number;
  total: number;
  rating: number | null;
}
```

### Service method
Add to `PollingService` (`src/app/services/polling.service.ts`):
```ts
getCandidateTrend(candidateId: number, accessToken: string): Observable<CandidateTrendPoint[]>
// GET {apiUrl}/polling/candidatetrend/{candidateId} with Bearer auth header
```
(Follow the existing header/`httpOptions` pattern used by the other methods in this service.)

### Chart component
New standalone component `src/app/candidate-trend-chart/candidate-trend-chart.component.ts`:
- `@Input() candidateId: number` and `@Input() accessToken: string`.
- On input change / init, calls `PollingService.getCandidateTrend`.
- Maps to a Chart.js line dataset: `labels = points.map(p => p.polling_name)`,
  `data = points.map(p => p.rating)`. Y axis fixed `min: 0, max: 100`, tooltip shows
  `rating% (Yes/Wait/No)`.
- Empty state: if 0 pollings, render a muted "No polling history yet" message, no chart.
- Single-point state: still render (a lone marker is fine).

### Integration point
In `candidates.component.html`, inside the `*ngIf="candidateSelected"` detail area,
above the "Polling Notes" accordion card, add:
```html
<app-candidate-trend-chart
  [candidateId]="selectedCandidateId"
  [accessToken]="accessToken">
</app-candidate-trend-chart>
```
Add `CandidateTrendChartComponent` to `CandidatesComponent.imports`. Confirm the
component already tracks the selected candidate id (it sets `candidateName`,
`candidateLink` in `viewCandidate`); add/reuse a `selectedCandidateId` field.

Data loads lazily only when a candidate is selected (no N calls on the list view).

## 6. Testing

**Backend (Jest):**
- Service returns points ordered by `end_date` ASC.
- Rating math: e.g. Yes 8 / Wait 2 / No 1 / Abstain 3 → 72.73; all-abstain → `rating: null`.
- Only `completed = true` notes counted.
- Private-note votes ARE included in counts (accuracy guarantee).
- Cross-order candidate id → empty/forbidden.

**Frontend (Karma/Jasmine — verify via `npx tsc -p tsconfig.spec.json --noEmit`):**
- Component maps trend points to labels/data correctly.
- Empty array → empty-state message, no chart instance.
- `null` rating renders as a gap.
- Service method issues the correct GET URL with auth header.

## 7. Rollout / files touched

**API repo (`Polling-API`)**
- `src/polling/polling.controller.ts` — add `GET /candidatetrend/:candidateId`.
- `src/polling/polling.service.ts` — add `getCandidateTrend(candidateId, authToken)`.
- `src/polling/polling.service.spec.ts` (or new spec) — tests.

**Frontend repo (`Polling`)**
- `package.json` — add `chart.js`, `ng2-charts`.
- `src/app/interfaces/candidate-trend.ts` — new.
- `src/app/services/polling.service.ts` — add method.
- `src/app/candidate-trend-chart/` — new component (+ spec).
- `src/app/candidates/candidates.component.ts` / `.html` — integrate.
- `src/main.ts` — add `provideCharts(withDefaultRegisterables())` to the
  `bootstrapApplication` providers array (the real bootstrap path).

## 8. Open decisions to confirm at approval
1. Server-side vs client-side rating computation — spec assumes **server-side**.
2. Ignore `polling_order_notes_time_visible` for the trend — spec assumes **ignore** (full history).
3. Endpoint path name `/polling/candidatetrend/:candidateId` — acceptable?
