# Spec: Round-2 Phase 3 (A3) — Batched Auto-save

Status: **Approved — building** (scope pre-approved in round-2-design.md)
Parent: [round-2-design.md](round-2-design.md)

## 1. Problem
Auto-save currently sends **one POST per changed row** (per-candidate 1s debounce). The API throttles at **20 requests/60s per IP**. A voter working through a 20+ candidate list will hit 429s — and households/sites behind one NAT share the budget. Backend cost is also N sequential queries per row-request.

## 2. Design — one debounced request for all dirty rows
Replace the per-row timer map in `pollings.component.ts` with:
- **`autoSaveDirty = new Map<number, PollingSummary>()`** — rows edited since the last successful save, keyed by `candidate_id` (map, so re-edits overwrite with the freshest row reference).
- **One shared debounce timer** (keep `AUTO_SAVE_DEBOUNCE_MS = 1000`): every `onRowChange` on a *meaningful* row (existing rule: has a vote or non-empty note) upserts the row into `autoSaveDirty` and re-arms the single timer. 1s after the *last* edit anywhere, fire once.
- **`autoSaveFlush()`**: snapshot dirty rows → `rows.map(r => ({ ...r, completed: false }))` → ONE `createPollingNotes(rowsArray, accessToken, votingMember)` call (endpoint already accepts an array; body[0] gets authToken/member id — works for any length). Clear the dirty map on send; on **error**, merge the snapshot back into the dirty map (without clobbering rows re-edited meanwhile) so nothing is lost and the next edit retries.
- **Single in-flight guard**: if a flush is in flight when the timer fires, defer — re-arm the timer instead of firing concurrently (no request overlap at all anymore).

## 3. Invariants that MUST survive (all currently tested)
- Auto-save writes **only `completed:false`**; never mutates the on-screen rows' completed flag; Submit remains untouched (`submitPolling` unchanged).
- Skip entirely-empty rows; suppressed while `isSubmitting`.
- `this.completed = false` flip on meaningful edit (draft banner honesty).
- Status line: 'saving' → 'saved' (auto-clear ~3s) / 'error'; **no toast from auto-save**.
- Timers + dirty state cleared on `ngOnDestroy` and at the start of `changeVoter` (no stale-voter saves); pending subscription unsubscribed.
- Admin proxy voting honored via `votingMember`.

## 4. Effect on throttle
Worst realistic case becomes ~1 request per typing-pause instead of per row: editing 30 candidates in bursts ≈ a handful of requests/min, comfortably under 20/60s even with page-load calls. (No backend change needed this phase.)

## 5. Testing
Rewrite the auto-save block of `pollings.component.spec.ts` (fakeAsync):
- Editing 3 different rows within 1s → **exactly ONE** `createPollingNotes` call whose body has 3 rows, each `completed:false`.
- Re-editing the same row before flush → 1 call, 1 row, freshest values.
- Edit during in-flight flush → second flush after the first completes (2 calls total, no overlap).
- Flush error → rows retained; next edit + debounce retries them (subsequent call includes the previously-failed rows); status 'error'; no toast.
- Empty-row skip, isSubmitting suppression, banner flip, changeVoter/destroy clearing — preserved (update existing tests to the batched world).
- Full suite green (baseline 144), both tsc configs clean.

## 6. Manual test (user)
Edit several candidates quickly → one "Saving draft… / Draft saved ✓" cycle; reload → all edits persisted. With the API stopped: edits show the error status, then restart API, edit once more → previously-failed rows included and saved (verify by reload).
