# Spec: Round-2 Phase 8 (C1 + C2) — Cleanup

Status: **Approved — building** (scope pre-approved in round-2-design.md)

## C1 — strip console noise + dead imports
- Remove `console.log`/debug logging from production code paths: `app.component.ts` (route params logged on every navigation), `admin.component.ts` (~12 logs incl. "Access token: Present" token-presence logging and order-policy chatter), `feedback.component.ts`, `policies.component.ts`. KEEP the `console.error` in `main.ts`'s bootstrap catch (legitimate last-resort).
- Remove `AngularEditorModule` from the SIX components that import it but never render `<angular-editor>`: login, profile, register, reset-password, report, candidates. (admin and candidate-images genuinely use it — keep.)

## C2 — remove jQuery
- Zero references in any source file (verified by grep); loaded only via `angular.json` scripts → dead ~90KB payload on every page.
- Remove from `angular.json` scripts array and `package.json`/lock (npm uninstall).

## Verification
- Full Karma suite green (baseline 187), both tsc configs clean.
- **Production build succeeds** (`ng build`) — the real gate for the angular.json change.
- Manual: app loads and behaves normally (no jQuery = no visible change expected).
