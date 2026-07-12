# Spec: Round-2 Phase 6 (B2) — Pending Registrations Tile

Status: **Approved — building** (scope pre-approved in round-2-design.md)
Parent: [round-2-design.md](round-2-design.md)

## 1. Problem
New member registrations are invisible until a clerk opens the Admin page AND expands the "Member Approval" accordion — no count or indicator anywhere. (This is the no-spam alternative to email notifications.)

## 2. Design — Tile E on the existing admin dashboard
- `admin-dashboard.component`: inject `MemberService`; new `loadPendingRegistrations(orderId, token)` via the existing `safeSubscribe` pattern.
- Data: `memberService.getAllOrderMembers(orderId, token)` filtered `approved === false` — **exactly** the filter the Member Approval panel uses (`admin.component.ts:239`), so the tile count always matches the panel.
- Tile E card: title "Pending Registrations"; count headline; list of names (cap at 8 + "+N more"); hint "Approve or deny in Member Approval below."
- States (dashboard conventions): loading, error fallback, empty → "No pending registrations."
- No backend changes; read-only; tile failure can never block the page.

## 2b. Amendment (user feedback 2026-07-12): tile length + non-voter opt-out
- **Tile C (candidates vs bar)** and **Tile D (non-voters)** lists capped at 8 entries + "+N more" (same pattern as Tile E). Summary counts unaffected.
- **Tile D is dismissible**: a small hide (×) control; preference persisted in `localStorage` (`dashboard-hide-nonvoters`) since per-order settings would require a DB schema change (out of bounds). When hidden, a subtle "Show non-voters tile" link restores it. Per-browser preference.

## 2c. Amendment (user feedback 2026-07-12): hide empty tiles
Tiles with nothing to show are hidden entirely instead of rendering empty states:
- Tile A hidden when there is no active polling (Tiles B/C follow, as they depend on it).
- Tile C also hidden when it loads zero candidates.
- Tile D hidden when there is no polling history OR no non-voters (in addition to the dismiss preference).
- Tile E hidden when there are no pending registrations.
- **Exception: error states stay visible** ("Unable to load…") so failures are never silently masked. Loading states render briefly, then the tile disappears if empty.
A fully quiet order ⇒ an (almost) empty dashboard — that's the point.

## 3. Testing
- Tile renders count + names from a mocked member list containing approved/unapproved mix.
- Empty (all approved) → empty state.
- Service error/undefined → error fallback, no throw.
- Cap: 10 unapproved → 8 names + "+2 more".
- Existing dashboard + admin specs stay green (admin spec mounts the dashboard; safeSubscribe guards its unstubbed spies).
- Full suite green (baseline 166), tsc clean.
