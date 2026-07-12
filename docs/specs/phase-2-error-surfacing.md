# Spec: Round-2 Phase 2 (A2) — Surface Errors to Users

Status: **Approved — building** (scope pre-approved in round-2-design.md)
Parent: [round-2-design.md](round-2-design.md)

## 1. Problem
`errorMessage` is assigned in ~40 error handlers but rendered in only 6 auth-ish templates; it's `private` in pollings/candidates/admin/report, so failures there are invisible. Worst case: **a failed vote submission shows nothing** (`pollings.component.ts` submit error handler just re-enables buttons). Now that the interceptor is registered (Phase 1), every error carries a friendly `err.error.message` — we just need somewhere to show it.

## 2. Design
### New shared toast
- `src/app/services/toast.service.ts` — `ToastService.show(message: string, kind: 'error' | 'success' = 'error')`; observable stream of active toasts; auto-dismiss after ~6s (errors) / ~4s (success); manual dismiss supported; duplicate-message coalescing (same message while visible → don't stack).
- `src/app/toast/toast.component.ts` (+ html/css/spec) — standalone; fixed-position stack (bottom center on mobile, bottom-right on desktop); Bootstrap `alert alert-danger`/`alert-success` styling with the app's palette; **`role="alert"`/`aria-live="assertive"`** for errors (a11y-consistent with #4 work); dismiss `×` button with aria-label.
- Rendered once in `app.component.html`; `ToastComponent` added to `AppComponent` imports.

### Wiring (errors only — success alert()/reload() flows stay as-is until B1/C1)
Call `toast.show(err.error?.message ?? '<fallback>')` in the error handlers of:
1. **pollings.component.ts** — `submitPolling` (fallback "Your vote could not be submitted. Please try again."), `getCurrentPolling`, `getVotes`, `getAllOrderMembers`. Auto-save keeps its existing inline status line (no toast — too noisy).
2. **report.component.ts** — both report fetch error handlers.
3. **candidates.component.ts** — candidate/note load + add/remove external note errors.
4. **admin.component.ts** — mutation error handlers (approve/deny member, add member, add/remove candidate, create/edit/delete polling, clerk changes, missing-votes/closed-report fetches). Replace the three policy error `alert()`s with toasts. Success `alert()`s untouched this phase.
5. **candidate-images.component.ts** — upload/delete errors (replace its one error alert).

Do NOT remove the existing `errorMessage` assignments (harmless), just add the toast call. No behavior changes to success paths.

## 3. Testing
- ToastService: show → emitted; auto-dismiss via fakeAsync/tick; duplicate coalescing.
- ToastComponent: renders message, `role="alert"` present, dismiss works.
- Wiring: pollings submit error triggers `ToastService.show` (spy); one similar assertion for report.
- Full suite green (baseline 126), both tsc configs clean.

## 4. Manual test (user)
In the test polling order: stop the local API mid-session and click Submit on the voting screen → a visible error toast appears (previously: nothing). Same for loading the report page with the API down.
