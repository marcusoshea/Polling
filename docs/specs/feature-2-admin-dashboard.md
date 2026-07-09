# Spec: Feature #2 — Admin Dashboard (at-a-glance)

Status: **Approved — building** (Tile D = chronic non-voters, N=3; tile set confirmed 2026-07-08)
Parent design: [next-features-design.md](next-features-design.md)

## 1. Summary
Add an at-a-glance dashboard to the top of the Admin view: active-polling status, current participation vs threshold, candidates vs the recommendation bar, and chronic non-voters. **Read-only, frontend-only, no backend changes.** Implemented as a **new standalone `AdminDashboardComponent`** so the 948-line `admin.component.ts` is not modified beyond adding the component tag + import (minimal, additive footprint — see §6).

## 2. Non-goals / safety
- No writes, no mutations — only existing GET endpoints. Cannot affect existing admin functionality or data.
- No backend changes; production DB untouched.
- Each tile fails **independently and gracefully** (endpoint error/empty → the tile shows a muted "—"/message; it never throws or blocks the rest of the admin page).
- No new dependencies.

## 3. Component
- New: `src/app/admin-dashboard/admin-dashboard.component.ts` (+ `.html`, `.spec.ts`), standalone.
- **Self-contained bootstrap:** reads `pollingOrder` + access token from `StorageService` in its own `ngOnInit` (same pattern as `report.component`/`admin.component`). This keeps the admin edit to just the tag + import — it does NOT need admin's `accessToken` exposed.
- Injects `PollingService`, `NotesService`, `StorageService`. Unsubscribes on destroy.

## 4. Tiles & data sources (all existing endpoints)

Rating math (consistent with the trend feature): `Yes / (Yes + Wait + No) * 100`.

### Tile A — Active polling status
- `PollingService.getCurrentPolling(orderId, token)` → `Polling` (polling_id, polling_name, start_date, end_date) or empty.
- Show: polling name, end date, **days remaining** (`end_date` − today). If none active → "No active polling in progress." (Tiles B & C then show a no-active-polling state; Tile D still renders.)

### Tile B — Participation vs threshold  (only when a polling is active)
- `PollingService.getInProcessPollingReport(orderId, token)` → array `[ {polling+order fields incl. polling_order_polling_participation, polling_order_polling_score, polling_id}, {active_members}, {member_participation} ]`. Active when `data[0]?.end_date !== undefined` (mirrors report.component:97).
- Compute `participationRate = member_participation / active_members * 100`. Show `{participating} of {active} = {rate}%`.
- Compare to `polling_order_polling_participation`: `rate >= threshold` → "on track to certify"; else "below certification threshold ({threshold}%)". If threshold is 0/absent → show rate only, no certify claim.

### Tile C — Candidates vs recommendation bar  (only when active AND `polling_order_polling_score > 0`)
- Use the active polling's `polling_id` (from Tile B's `data[0].polling_id`) → `NotesService.getPollingReportTotals(pollingId, token)` → per-candidate tallies `{ name, vote, total }`.
- Per candidate compute rating; classify **at/above** vs **below** `polling_order_polling_score`.
- Show a summary ("N of M candidates at/above {score}%") and a short list: candidate name — rating% — ▲ (at/above) or ▼ (below).
- Hidden entirely when `polling_order_polling_score` is 0 (type-2 orders / no bar).

### Tile D — Chronic non-voters
- `PollingService.getMissingVotesReport(orderId, N, token)` with **N = 3** → `[{ pollings: [...], missing_in_all: Member[] }]`.
- Show the count + names from `missing_in_all`, labeled clearly: "Missed **all** of the last {pollings.length} pollings" (use the returned `pollings.length`, which may be < 3 if fewer exist). If list empty → "Everyone has voted in at least one of the last N pollings." If < 1 polling exists → muted "Not enough polling history."

## 5. Layout
- A responsive row of Bootstrap cards (reuse existing `card card-container custom-card` classes) at the top of the admin content, above the first expansion panel.
- Muted/empty states per tile; a single spinner or "Loading…" per tile while its call is in flight.

## 6. Admin integration (the only edit to existing files — additive)
- `admin.component.html`: add `<app-admin-dashboard></app-admin-dashboard>` at the very top of the admin content (inside the `showAdmin` area, before the first panel).
- `admin.component.ts`: add `AdminDashboardComponent` to the `imports` array. **No other changes.**

## 7. Testing
- **Unit (Karma) `admin-dashboard.component.spec.ts`:** mock the services; assert per tile:
  - Active polling present → name/days-remaining shown; absent → "No active polling" state.
  - Participation rate computed correctly; on-track vs below-threshold text flips at the threshold.
  - Candidate classification above/below score; Tile C hidden when score is 0.
  - Non-voters list from `missing_in_all`; empty + no-history states.
  - A tile whose service errors renders its graceful fallback and does not throw.
- **Regression:** full suite must stay green (currently **93**); existing `admin.component.spec` unchanged and passing.
- **Type-check:** `tsconfig.spec.json` + `tsconfig.app.json` → exit 0.

## 8. Open decisions
1. Tile set A–D above — add/drop any? (e.g., is "chronic non-voters = missed all of last 3" the right non-voter metric, or would you prefer "hasn't voted in the *current* polling"?)
2. `N = 3` for the non-voter lookback — good default?
