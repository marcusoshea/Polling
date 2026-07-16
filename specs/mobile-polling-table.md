# Spec: Mobile-friendly polling/voting table

## Problem

On the active-polling voting screen (`pollings.component`), voters see a 4-column
`mat-table`: **Polling Candidate**, **Your Note**, **Your Vote**, **Private Response**.

On a narrow (phone) viewport the table is wider than the screen. Today it sits inside
`<div class="table-responsive" style="overflow-x:auto">`, so the overflow becomes a
horizontal scroll. In practice:

- The **Private Response** column is off-screen entirely (voters don't know it exists).
- The **Your Vote** `mat-select` is clipped ("Select Your Vote" is cut off).
- Voters must horizontally scroll a table to cast a vote — awkward and error-prone on touch.

Confirmed on iPhone / Safari (see attached screenshot in the task).

## Goal

Every field for a candidate — name link, note, vote, private toggle — is fully visible
and usable on a phone **without horizontal scrolling**.

## Approach

**Separate mobile layout** (revised after a CSS-reflow attempt failed). Trying to restyle
Angular 19's MDC `mat-table` into stacked cells was fragile — the native-table structure
(`<thead>`/rows) didn't respond to the reflow selectors and rows overlapped.

Instead, render two layouts from the same data:

- **≥576px:** the existing `<table mat-table>`, untouched, inside a `d-none d-sm-block`
  wrapper.
- **<576px:** a purpose-built card list (`d-block d-sm-none`) that `*ngFor`s over the
  filtered rows and renders plain `<div>` cards — each with the candidate name link, a
  labeled note `<textarea>`, a labeled vote `<mat-select>`, and a `<mat-checkbox>`.

Both bind the **same row objects** and the **same handlers** (`viewCandidate`,
`onRowChange`, `ngModel`), so auto-save/submit/filter logic is shared with zero changes to
those methods. Only additions to the component: a `mobileRows` getter (filtered rows) and
a `trackByCandidate` fn.

## Requirements

1. **Breakpoint.** Reuse the existing small-screen breakpoint already in the file:
   `@media (max-width: 575.98px)` (Bootstrap `xs`).

2. **No horizontal scroll on mobile.** The table (and its `overflow-x:auto` wrapper) must
   not produce a horizontal scrollbar at 320px–575.98px width. Every control fits within
   the viewport width.

3. **Stacked rows.** On mobile each `<tr>` renders as a full-width card (visible
   separation between candidates). Within a card, the four cells stack vertically in
   source order: name, note, vote, private.

4. **Inline labels.** Because the `<thead>` is hidden on mobile, each cell shows its
   column label inline (e.g. "Your Note", "Your Vote", "Private Response") via a
   `data-label` attribute + CSS `::before`. The name row may omit a label (the link is
   self-evident).

5. **Full-width controls.** The note `<textarea>` and the vote `<mat-select>` expand to
   the card's full width so the select's placeholder/value is never clipped.

6. **No regressions on wider screens.** At ≥576px the table renders exactly as it does
   today (unchanged column layout). Desktop is untouched.

7. **Accessibility preserved.** All existing `aria-label`s remain. Touch targets keep the
   ≥44px min-height already specified for this breakpoint.

8. **Logic untouched.** No changes to `pollings.component.ts` behavior (filtering,
   auto-save, submit, sorting). Only template gains `data-label` attributes; only CSS
   changes.

## Out of scope

- The `polling-candidate` detail dialog (already handled separately).
- Any change to the desktop table layout.
- Column reordering or hiding data on mobile — all four fields stay present.

## Verification

- `npx tsc -p tsconfig.spec.json --noEmit` passes (no Chrome for Karma in this env).
- Manual/DevTools check at 375px: no horizontal scroll; name, note, vote, and private
  all visible and operable; each cell labeled; rows visually separated.
- Manual/DevTools check at ≥576px: table looks identical to before.
