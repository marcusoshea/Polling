# Polling

Angular 19 frontend for the Polling application.

## Pre-requisites

- Node.js 18+
- Firefox (used as the test browser)
- The [Polling-API](../Polling-API) backend running locally or accessible via the configured `apiUrl`

## Installation

```bash
npm install
```

## Development server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app reloads automatically on file changes.

## Build

```bash
ng build
```

Build artifacts are output to the `dist/` directory.

## Running tests

Tests use **Karma + Jasmine** with **Firefox** (headless by default).

```bash
# Run all tests once (no watch)
npx ng test --watch=false

# Run tests in watch mode (reruns on file changes)
npx ng test
```

### Test setup notes

- The test browser is **FirefoxHeadless** (configured in `karma.conf.js`). Firefox must be installed.
- Components are Angular 19 standalone — specs use `imports: [ComponentName]` (not `declarations`).
- HTTP services use `HttpClientTestingModule`; standalone component specs use `provideHttpClient()` + `provideHttpClientTesting()`.
- `StorageService` tests mock `sessionStorage` via `Object.defineProperty` for Firefox compatibility.
- Navigation in production code uses Angular `Router` (not `window.location`) to keep tests framework-friendly.

## Further help

Run `ng help` or see the [Angular CLI documentation](https://angular.io/cli).
