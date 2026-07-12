# Spec: Round-2 Phase 5 (B1) — Voting Screen UX

Status: **Approved — building** (scope pre-approved in round-2-design.md)
Parent: [round-2-design.md](round-2-design.md)

## 1. Scope — five improvements to `pollings.component`
1. **Progress indicator** — "You've voted on X of N candidates."
2. **Deadline countdown** — "Polling closes in N days."
3. **Candidate filter** — search box over the voting table.
4. **Pre-submit review/confirm** — a summary dialog before a real submit.
5. **Replace `alert()` + `window.location.reload()`** with in-place refresh + success toast.

No backend changes. Auto-save (Phase 3), draft banner, toasts (Phase 2), and a11y (#4) must keep working.

## 2. Design

### 2a. Progress indicator
- Getter `votedCount` = rows in `dataSourcePS.data` with `vote != null`; `totalCandidates` = data length.
- Render above the table: `You've voted on {{votedCount}} of {{totalCandidates}} candidates.` Live (recomputes on edit). Muted style; `aria-live="polite"` not needed (recomputed in place is fine).

### 2b. Deadline countdown
- `daysRemaining` from `currentPolling.end_date` (same math as the dashboard tile: `Math.ceil((end - today)/86400000)`).
- Next to the existing dates line: "— closes in N days" / "— closes today" (N<=0 defensive: "— closing"). Plain text, no timer needed.

### 2c. Candidate filter
- Input above the table using `dataSourcePS.filter` (MatTableDataSource) with a `filterPredicate` on candidate `name` (same pattern as candidates page `applyFilter`).
- **Label + aria-label** (a11y phase conventions). Filtering affects only the rendered rows; `dataSourcePS.data` (what submit/auto-save use) is untouched — verify this in a test.

### 2d. Pre-submit review/confirm (real submit only; Save Draft stays immediate)
- Clicking **Submit / Update** opens a Material dialog (reuse `MatDialog`, already injected):
  - Title "Review your votes"; a compact list: candidate name — vote word (Yes/Wait/No/Abstain) or **"No vote"** highlighted for unvoted rows; count line "X of N voted".
  - Buttons: **Confirm Submit** (proceeds) / **Go Back** (closes, nothing sent).
- Implement as a small standalone dialog component in the pollings folder (like `PollingCandidate`), receiving rows via `MAT_DIALOG_DATA`. Vote-word mapping helper shared with the template's ngSwitch semantics.
- Dialog is accessible: Material dialog handles focus trapping; buttons are real buttons.

### 2e. In-place submit (remove alert + reload)
Rewrite `submitPolling`'s success handling (the ONLY intentional change to its behavior):
- **On entry (both draft and submit): clear ALL pending auto-save state** — debounce timer, dirty map, in-flight flush subscription. ⚠️ CRITICAL: today the page reload incidentally kills pending auto-save timers; without the reload, a timer armed before Submit could fire after success and write `completed:false`, silently un-submitting the vote. This must be prevented and covered by a test.
- On success: success toast (`ToastService.show(msg, 'success')`) — "Your polling vote has been submitted." / "Draft saved — your vote is NOT submitted yet."; then `this.getVotes()` to refresh rows/banner in place; `isSubmitting = false`.
- On error: existing Phase-2 toast behavior stays.
- Remove the alerts and both `window.location.reload()` calls in this method. Keep the misleading `draft` parameter working as-is (true = submit) but add a clarifying comment; do NOT rename in templates (two call sites) unless trivial to do safely.

## 2f. Amendment (user decision 2026-07-12): once submitted, always submitted
- Progress wording: **"Polled X of N candidates."** (not "You've voted on…").
- New field `hasSubmitted`: true when the member's polling loads fully submitted (`getVotes` → `this.completed`) or after a successful real submit; recomputed on `changeVoter`.
- **Auto-save becomes submission-aware:** flush writes `completed: this.hasSubmitted`. Before first submission → drafts (`false`, never counted — unchanged). After first submission → edits are amendments to an already-cast vote and stay `completed: true` (still counted in reports), matching the long-standing "Update Your Submitted Polling Vote" semantics.
- **Banner:** once `hasSubmitted`, editing does NOT flip the banner back to draft — it stays "Submitted". The `this.completed = false` flip in `onRowChange` applies only while `!hasSubmitted`.
- Safety unchanged where it matters: a never-submitted member still cannot get counted without explicitly clicking Submit.

## 3. Testing
- Progress: seeded rows → correct X/N; updates after editing a row.
- Countdown: fixed dates → correct day count; "closes today" edge.
- Filter: filter string reduces rendered rows; `dataSourcePS.data` length unchanged; submit still posts ALL rows while a filter is active.
- Confirm dialog: Submit click opens dialog (spy on MatDialog.open) instead of posting; dialog Confirm → `createPollingNotes` called; Go Back → no call. Save Draft posts immediately without a dialog.
- **Race test:** arm an auto-save debounce (edit a row), click Submit + Confirm before the timer fires, tick past the debounce → NO auto-save request fires after the submit (only the submit's own call).
- Submit success: no reload (spy/window untouched — assert `getVotes` called and success toast shown).
- Full suite green (baseline: FE 144), both tsc configs clean.

## 4. Manual test (user)
Vote on a few of many candidates → progress line updates; filter narrows the list; Submit shows the review dialog (unvoted candidates flagged); Confirm → success toast, no page reload, banner flips to Submitted; Save Draft still immediate. Deadline line shows sensible days-remaining.
