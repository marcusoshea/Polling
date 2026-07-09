# Spec: Feature #1 — Auto-save Drafts While Voting

Status: **Approved — building** (debounce 1000ms, status line near buttons; confirmed 2026-07-08)
Parent design: [next-features-design.md](next-features-design.md)

## 1. Summary
On the voting screen ([pollings.component](../../src/app/pollings/pollings.component.ts)), silently auto-save a voter's in-progress votes/notes as **drafts** (`completed: false`) so long candidate lists aren't lost (especially on mobile). **Reuses the existing create endpoint — no backend change.** Submitting stays a separate, explicit, mandatory action.

## 2. Critical constraints (from design pass — do not violate)
- **Drafts never count.** Every tally/participation query filters `completed = true`; a polling ending does NOT promote drafts. So auto-save must write **only `completed: false`** and must NEVER set `completed: true`.
- **Submit stays mandatory.** The existing Submit button remains the only path to `completed: true`. Auto-save must not lull the voter into thinking a saved draft = a cast vote.
- **Clear draft-vs-submitted status.** A persistent, unmistakable "Draft — not yet submitted" indicator whenever the voter has unsubmitted work; a clear submitted state otherwise.
- **Silent.** No `alert()`, no `window.location.reload()` (the current Save Draft does both — auto-save must not).

## 3. Validation de-risking (resolves the design-pass unknown)
The create DTO marks `note`/`vote` as required, raising the question of whether a partial-row array 400s. **Resolution:** auto-save sends the **same payload shape the existing "Save Draft" (`submitPolling(false)`) already sends and which already works in production** (rows with empty notes / null votes included). Because the payload shape is identical, auto-save has the same validation outcome as the working Save Draft — no new risk. (Root cause, per design pass: NestJS `ValidationPipe` skips the `Array` metatype, so bare `CreatePollingNoteDto[]` elements aren't validated.) The build should still confirm a real auto-save request returns 200 during manual verification.

## 4. Behavior
### 4a. Trigger
- Add `(ngModelChange)="onRowChange(element)"` to the vote `<mat-select>`, note `<textarea>`, and private `<input checkbox>` in [pollings.component.html](../../src/app/pollings/pollings.component.html).
- `onRowChange(element)` debounces **~1000ms per candidate row** (a per-`candidate_id` timer map), then calls `autoSaveRow(element)`.
- **Only auto-save a row that has meaningful input:** `element.vote != null || (element.note && element.note.trim().length > 0)`. Skip entirely-empty rows.
- Do not auto-save while a full `submitPolling` is in flight (`isSubmitting`).

### 4b. The save
- `autoSaveRow(element)`: build a **single-element array** `[{ ...element, completed: false }]` and call the existing `pollingService.createPollingNotes([row], this.accessToken, this.votingMember)`. The service injects `authToken` + `polling_order_member_id` onto `body[0]` (works for a 1-element array). Honors the admin proxy-voter case because it uses `this.votingMember` (set by `changeVoter`).
- **No id round-trip needed:** new rows send `polling_notes_id: null`; the backend UPSERTs by unique key `(polling_id, candidate_id, polling_order_member_id)`, so repeated saves update rather than duplicate.
- Never mutate the on-screen row's `completed` to `true`. (Set the sent copy's `completed:false`; leave the displayed model as the user left it.)
- Per-row in-flight guard so a row's overlapping saves don't race (skip/queue if a save for that row is already pending).

### 4c. Status indicator
- A single component field `autoSaveStatus: '' | 'saving' | 'saved' | 'error'`, shown as a small unobtrusive line near the buttons ("Saving draft…", "Draft saved ✓", "Auto-save failed — your Submit still works"). Auto-clears the "saved" state after a few seconds.
- **Persistent draft banner:** when the voter has any unsubmitted work (reuse the existing `completed` flag — it's `false` when any row is `completed:false`), show a prominent banner: **"Draft — not yet submitted. Click Submit to cast your vote."** When `completed` is true (all submitted), show a submitted confirmation instead.

### 4d. Leave submit as-is
Do not change `submitPolling` behavior (it still sets all rows `completed = draft`, posts, alerts, reloads). Auto-save is additive.

## 5. Cleanup / edge cases
- Clear all pending debounce timers on `ngOnDestroy` and on `changeVoter` (voter switch reloads votes; stale timers must not fire against the new voter).
- If auto-save errors, set `autoSaveStatus='error'` and DO NOT block the UI — the manual Save Draft / Submit still work.
- Auto-save must be resilient to `dataSourcePS.data` being reassigned by `getVotes()`.

## 6. Testing (Karma; verify via `tsc` since no headless Chrome guaranteed)
- `onRowChange` skips empty rows; fires (after debounce) for rows with a vote or non-empty note. Use fakeAsync/tick for the debounce.
- `autoSaveRow` calls `createPollingNotes` with a **1-element array**, `completed:false`, using `votingMember`, and never `completed:true`.
- Overlapping changes to the same row coalesce to a single save after debounce.
- `autoSaveStatus` transitions saving→saved; error path sets 'error' and doesn't throw.
- Timers cleared on destroy / voter change (no save fired for the old voter after switch).
- Existing pollings smoke test still passes.
- Full suite stays green (currently 107).

## 7. Files touched (frontend only)
- `src/app/pollings/pollings.component.ts` — add `onRowChange`, `autoSaveRow`, debounce timer map, in-flight guards, `autoSaveStatus`, destroy cleanup.
- `src/app/pollings/pollings.component.html` — add `(ngModelChange)` handlers to the 3 controls; add the status line + persistent draft/submitted banner.
- `src/app/pollings/pollings.component.spec.ts` — tests above.

## 8. Open decisions
1. Debounce ~1000ms — good?
2. Status placement — a small line near the Submit buttons (recommended) vs per-row.
