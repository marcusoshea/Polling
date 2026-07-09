# Spec: Feature #3 — PDF Export of Closed Polling Report (Admin)

Status: **Rebuilding — relocated to Admin (2026-07-08)**
Parent design: [next-features-design.md](next-features-design.md)

## 1. Summary
Add an "Export PDF" button to the **Closed Polling Reports** section of the **Admin** view ([admin.component](../../src/app/admin/admin.component.ts)), generating a downloadable PDF of the currently-loaded closed polling report. The PDF **mirrors what is on screen**, honoring the section's three checkboxes. `pdfmake` (v0.2.15) already installed. Frontend only, no backend.

**The feature is REMOVED from the polling reports page** ([report.component](../../src/app/report/report.component.ts)) — it lives only in Admin now.

## 2. Scope & access
- **PDF only.** Content mirrors the on-screen admin closed report given the current checkbox states (WYSIWYG).
- **Access:** inherently clerk-only — the Admin component already redirects non-clerks to `/home` in `ngOnInit` (`this.showAdmin = member.isOrderAdmin; if (!this.showAdmin) router.navigate(['/home'])`). So living in Admin satisfies "admins + assistants only" with no extra gate. (Keep a defensive `if (!this.showAdmin) return;` in the export method.)
- **"Recommended" shows only when `pollingOrderScore > 0`** (unchanged decision).

## 3. Data source (all on `this.closedPollingReport` — no backend/service change)
`closedPollingReport` (populated by `getClosedPollingReport()` / `getSpecificClosedPollingReport()`, admin.component.ts ~602-632) has the SAME shape as the report page used: `pollingOrderName, pollingTitle, startDate, endDate, pollingOrderPollingType, pollingOrderParticipation, pollingOrderScore, participatingMembers, activeMembers, participationRate, certified, candidateList[], pollingTotal[]`.
- Per candidate (`candidateList[]`): `name, rating, recommended, inProcessRating, candidate_id, notes[]`.
- `pollingTotal[]`: `{ name, vote:'Yes'|'Wait'|'No'|'Abstain'|'Null', total }`.
- Notes (`candidateList[].notes[]`): `{ note, vote (NUMERIC 1=Yes/2=Wait/3=No/4=Abstain), private, member_name, completed }`. (Admin is a clerk, so private notes are present.)

**Checkbox fields** (admin.component.ts:131-133, all default `true`): `showAdminNotes`, `showAdminPrivateNotes`, `showAdminVotes`.

## 4. Design

### 4a. Pure builder + side-effect wrapper (testability)
- **`buildClosedReportDocDefinition(): any`** — PURE. Reads `this.closedPollingReport` + the three checkbox flags; returns a pdfmake doc object. No I/O.
- **`exportClosedReportPdf(): void`** — guards `if (!this.showAdmin || !this.closedPollingReport) return;`, then `pdfMake.createPdf(this.buildClosedReportDocDefinition()).download(filename)`.
- Reuse a pure `voteTotalsFor(name)` helper (reduces `pollingTotal`).

### 4b. PDF content (mirror the on-screen admin report)
- **Title:** `{pollingOrderName} — {pollingTitle}` (closed report; no NOT-FINALIZED — admin export is closed reports only).
- **Header block:** date range; for `pollingOrderPollingType===1` with `pollingOrderParticipation>0`: participation line (`participatingMembers`/`activeMembers` = `participationRate`%, `certified`) and, if `pollingOrderScore>0`, the "must attain {score}%" line. Type 2 → top-candidates note.
- **Candidate summary table** (order as in `candidateList`): `Candidate | Yes | Wait | No | Abstain | Rating %`, plus a `Recommended?` column **only when `pollingOrderScore > 0`** (`rating >= pollingOrderScore ? 'Yes' : 'No'`). **The vote tally counts always appear** (mirrors screen — "Show Votes" does NOT hide them).
- **Notes section** — rendered **only when `showAdminNotes` is true**. For each candidate, notes sorted via the existing `sortNotes(cl.notes)` logic, then per note mirror the on-screen `*ngIf` chain:
  - Skip when `note.private && !showAdminPrivateNotes` (private hidden).
  - Skip when `!showAdminVotes && !note.note` (votes hidden AND note has no text → nothing to show).
  - Render line: `PRIVATE RESPONSE: ` prefix when `note.private`; then the vote word (`1→Yes,2→Wait,3→No,4→Abstain`) **only when `showAdminVotes`**; then `--- {note.note}` when `note.note` present; then `- {member_name}`.
  - Skip candidates that end up with zero renderable notes; guard `notes` undefined.
- **Footer:** "Generated {date}" via `new Date()`.

### 4c. Button placement
In [admin.component.html](../../src/app/admin/admin.component.html) closed-report section (~after the Generate Report button / when `closedPollingReport` is present, ~line 463), add:
```html
<button *ngIf="closedPollingReport" type="button" class="btn btn-primary m-2"
        (click)="exportClosedReportPdf()">Export PDF</button>
```

### 4d. Filename
`{pollingTitle}-report-{YYYY-MM-DD}.pdf`, spaces→`-`, unsafe chars stripped.

## 5. Remove from report page
- Revert all PDF additions from `report.component.ts` (remove `exportPdf`, `buildReportDocDefinition`, `voteTotalsFor`, pdfmake imports/vfs) and `report.component.html` (remove the Export PDF button), and remove the PDF tests added to `report.component.spec.ts`. Leave the pre-existing `require("html-to-pdfmake")` line exactly as it was originally (it predates this feature).

## 6. Testing
- **Unit (Karma) in `admin.component.spec.ts`:** set `closedPollingReport` + checkbox flags directly, then assert on `buildClosedReportDocDefinition()`:
  - Recommended? column present only when `pollingOrderScore>0`.
  - Tally counts present regardless of `showAdminVotes`.
  - `showAdminNotes=false` → no notes section.
  - `showAdminPrivateNotes=false` → private notes excluded; `=true` → included with `PRIVATE RESPONSE:` prefix.
  - `showAdminVotes=false` → note vote words omitted and text-less notes skipped.
  - `exportClosedReportPdf` no-ops when `showAdmin=false` or no report.
  - Runtime Blob smoke test (`getBlob` size>0) proving pdfmake vfs wiring.
- **`report.component.spec.ts`:** confirms it still passes after the PDF tests are removed (back to its prior tests).
- **Type-check:** both `tsconfig.spec.json` and `tsconfig.app.json` → exit 0. Full suite green.

## 7. Files touched
- `src/app/admin/admin.component.ts` — add pdfmake wiring + `voteTotalsFor`, `buildClosedReportDocDefinition`, `exportClosedReportPdf`.
- `src/app/admin/admin.component.html` — add Export PDF button in closed-report section.
- `src/app/admin/admin.component.spec.ts` — new tests.
- `src/app/report/report.component.ts` / `.html` / `.spec.ts` — **revert** the PDF additions.

## 8. Risk
- pdfmake vfs/fonts wiring under Angular 19 esbuild — same as before; confirmed working via the runtime Blob test. Reuse the proven import shape (`pdfMake.vfs = pdfFonts?.vfs ?? pdfFonts?.pdfMake?.vfs ?? pdfFonts`).
