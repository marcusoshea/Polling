# Round 2 Design: Defect Fixes + UX Improvements

Status: **Approved scope** (2026-07-12) — A1–A4, B1–B4, C1, C2; C4 deferred (editor IS in use); C3 not in scope.
Constraint: **no email features**; extreme care with the production DB; test each phase before the next.

## Phases (one commit each, testable increments)

| Phase | Item | Repo | Risk |
|---|---|---|---|
| 1 | **A1** Register `TheInterceptor` in `main.ts` (401 → logout redirect; friendly 0/403/5xx messages) | FE | Low — interceptor is response-only |
| 2 | **A2** Surface errors to users: shared toast/banner; wire into pollings (submit failure first!), candidates, report, admin | FE | Low |
| 3 | **A3** Batch auto-save: collect dirty rows, one debounced POST (fixes 429 risk vs 20req/60s throttle; also fewer backend queries) | FE | Med — touches auto-save; full regression needed |
| 4 | **A4** Sanitize non-HttpException 500s in `GlobalExceptionFilter` (no raw Postgres text; unique-violation → 409) | API | Low — error formatting only, no DB writes |
| 5 | **B1** Voting screen: progress ("X of N voted"), deadline countdown, candidate filter, pre-submit review/confirm, replace alert()+reload() with in-place refresh | FE | Med |
| 6 | **B2** Admin dashboard: pending-registrations tile (count + names, links to approval panel) | FE | Low |
| 7 | **B3** Candidates page: watch-list filter toggle + matSort; **B4** vote-meaning tooltips on the voting select | FE | Low |
| 8 | **C1** Strip console.* noise (incl. token-presence + route-param logs); **C2** remove jQuery from angular.json + package.json (0 references confirmed) | FE | Low |

Facts backing the plan: interceptor registered only in never-bootstrapped `app.module.ts`/dead `app.config.ts`; `errorMessage` rendered in only 6 auth-ish templates, private elsewhere; throttle `ttl 60000 / limit 20` per IP vs 1 POST per changed row; filter puts `exception.message` into 500 bodies; jQuery grep = 0 hits; angular-editor used in admin policies + candidate-images.

## C4 (angular-editor) — deferred decision
`@kolkov/angular-editor@3.0.0-beta.0` is an unmaintained beta but actively used in 2 places. Options later: replace with maintained editor, or plain textarea + limited markdown. Separately: 6 components import `AngularEditorModule` without using it — dead imports removable in C1.

## Testing strategy (how we catch bugs before prod)

1. **Test polling order inside prod DB.** Data is partitioned by `polling_order_id`, so a dedicated test order + test accounts (admin, assistant, regular member) is a de-facto staging environment. All manual testing happens there.
2. **Local Postgres for risky scenarios** (recommended before pushing A3): `pg_dump --schema-only` from prod → Docker Postgres → point `development.env` at localhost. Enables race/throttle/destructive testing with zero prod risk. Remember DEPLOY.md gotcha #2: revert env to AWS values before building a prod dist.
3. **Automated suites as the regression gate.** FE 125 / API 31+ tests; every phase adds tests and must leave the full suite green + both tsc configs clean.
4. **Pre-push adversarial review.** Before pushing the accumulated commits: run a high-effort code review over the full unpushed diff (`origin/main...HEAD`, both repos). `/code-review ultra` (user-triggered) is the heavyweight option.
5. **Staged deploy.** Push + deploy the **API first** (all new endpoints are additive; old frontend keeps working), curl-verify health, then upload the frontend dist. CORS localhost allowance is non-production-only.
6. **Per-phase manual smoke** in the test order, desktop + ~375px.
