# Spec: Round-2 Phase 7 — B3 Watch-list Filter & Sorting + B4 Vote Meanings

Status: **Approved — building** (scope pre-approved in round-2-design.md)
Parent: [round-2-design.md](round-2-design.md)

## B3 — Candidates page: watch-list filter + column sorting
Current state: the candidates table (`candidates.component`) has a name text filter only; `watch_list` is a display-only check icon; **no sorting** (no matSort, unlike the voting table).

### Design
1. **Watch-list toggle:** a labelled checkbox "Watch list only" next to the existing search input. Combined filtering via a custom `filterPredicate` — serialize `{ text, watchOnly }` as the filter string (`JSON.stringify`), predicate returns `(!watchOnly || row.watch_list) && name.includes(text)`. Existing `applyFilter` updated to feed the combined payload; empty text + toggle off ⇒ show all (note: MatTableDataSource skips filtering on empty string — always set a non-empty JSON payload so the predicate runs).
2. **Sorting:** add `matSort` to the candidates table with `mat-sort-header` on **name** and **watch list** columns, default `name asc`. `MatSort` wired via a **ViewChild setter** (the list table is inside `*ngIf="!candidateSelected"`, so the sort ref is destroyed/recreated when navigating into and back out of a candidate — a static ViewChild would go stale). `sortingDataAccessor` for `watch_list` (boolean → 0/1).
3. A11y: checkbox has a proper label/aria-label; sort headers are native mat-sort (keyboard accessible).

## B4 — Voting screen: what the votes mean
Current state: Yes/Wait/No/Abstain definitions exist ONLY as prose on the Home page; the voting `mat-select` options are bare labels. ("Wait" is hidden for polling orders 1 and 8.)

### Design
1. **Inline expandable hint** (works on phones, unlike hover tooltips): a small toggle above the voting table — link/button "What do the votes mean?" (aria-expanded) — expanding a compact definition list, wording matching the Home page:
   - **Yes** — the candidate is ready to join the order.
   - **Wait** — showing good progress but not yet ready. *(hidden for orders 1 and 8, same condition as the option)*
   - **No** — not ready to join the order.
   - **Abstain** — you do not have an opinion on this candidate.
2. **Desktop bonus:** `matTooltip` with the same short definitions on each `mat-option` (import `MatTooltipModule`). Harmless on touch, helpful on hover.

## Testing
- B3: toggle on → only watch-list rows in `filteredData`; combined with text filter; toggle off + empty text → all rows; sorting by name asc/desc works and by watch-list groups checked rows; navigating into a candidate and back re-attaches sort (setter ViewChild — assert dataSource.sort truthy after toggle back).
- B4: hint hidden by default; toggle renders definitions; Wait definition absent when polling_order_id is 1 (or 8); aria-expanded flips. Existing voting tests stay green.
- Full suite green (baseline 176), tsc clean.

## Files
- `candidates.component.ts/.html/.spec.ts` (B3)
- `pollings.component.ts/.html/.spec.ts` (B4; + MatTooltipModule import)
