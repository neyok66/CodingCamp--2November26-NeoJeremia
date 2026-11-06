# Implementation Plan: Todo List Life Dashboard

## Overview

This plan implements a single-page, vanilla HTML/CSS/JavaScript Dashboard with four widgets (Greeting, Focus Timer, To-Do List, Quick Links) that stores all data in Local Storage. The architecture follows the design's pure/impure separation: pure logic (greeting mapping, time/date formatting, timer state machine, validation, serialization) lives in pure functions with no DOM or storage access, exposed on a single global `window.Dashboard` namespace via an IIFE; impure controllers (GreetingWidget, FocusTimer, TodoList, QuickLinks, Storage) call the pure functions and apply results to the DOM and Local Storage.

Implementation proceeds bottom-up: project structure and test harness first, then each pure-logic module with its property-based tests, then the Storage service, then each controller with its unit/integration tests, and finally the DOMContentLoaded wiring plus smoke tests. Property-based tests use `fast-check` and Vitest in a `jsdom` environment; each property is its own test file so tests can run in parallel. All production behavior lives in exactly three files (`index.html`, `css/styles.css`, `js/app.js`) with no build step and no external runtime libraries, so the app opens directly via `file://`.

## Tasks

- [ ] 1. Set up project structure, styling, and test harness
  - [x] 1.1 Create `index.html` with widget containers and asset links
    - Single HTML document linking `css/styles.css` in the head and `js/app.js` before `</body>`
    - Container elements with ids for the four widgets: greeting, focus timer, to-do list, quick links; no inline `<style>` or inline `<script>`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 1.2 Create `css/styles.css` with layout, spacing, typography, and contrast
    - Grid/flex layout for the four widgets with consistent spacing and visually identifiable, non-overlapping boundaries
    - Base font-size of at least 16px and text/background contrast ratio of at least 4.5:1 for time, date, greeting, tasks, and link display names
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 1.3 Create `js/app.js` IIFE scaffolding and `Dashboard` namespace
    - Single IIFE assigning `window.Dashboard = {}` with sub-namespaces (`greeting`, `time`, `timerFormat`, `timer`, `taskValidate`, `linkValidate`, `serialize`, `Storage`, `GreetingWidget`, `FocusTimer`, `TodoList`, `QuickLinks`)
    - Export pure helper signatures as no-ops/stubs to be filled by later tasks; no ES module imports
    - _Requirements: 9.3, 9.4_

  - [x] 1.4 Set up test harness (Vitest + fast-check + jsdom)
    - Add `package.json` with dev-only dependencies (vitest, fast-check, jsdom) and a `"test": "vitest run"` script
    - Add `vitest.config.js` with `environment: "jsdom"` and test glob matching `tests/**/*.test.js`
    - _Requirements: (test infrastructure; supports all property/unit/integration tests)_

- [x] 2. Implement pure greeting and time/date logic
  - [x] 2.1 Implement `Dashboard.greeting.getGreeting` and `Dashboard.time.formatTime`/`formatDate`
    - `getGreeting(hour 0..23)` returns "Good Morning" (5-11), "Good Afternoon" (12-16), "Good Evening" (17-20), "Good Night" (0-4 and 21-23)
    - `formatTime(date)` returns `HH:MM:SS` with zero-padded numeric components matching the date's hours/minutes/seconds
    - `formatDate(date)` returns a string containing the numeric day, month, and year of that date
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]* 2.2 Write property test for greeting hour-to-text partition
    - Create `tests/properties/p01-greeting.test.js`
    - **Property 1: Greeting hour-to-text partition** — generate hours `0..23`; assert each maps to exactly one greeting and the ranges partition `0..23` (Morning 5-11, Afternoon 12-16, Evening 17-20, Night 0-4 and 21-23) with no gaps or overlaps
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [x]* 2.3 Write property test for time and date formatting
    - Create `tests/properties/p02-time-format.test.js`
    - **Property 2: Time and date formatting** — generate random `Date` values; assert `formatTime` matches `/^\d{2}:\d{2}:\d{2}$/` with numeric components equal to the date's hours/minutes/seconds, and `formatDate` contains the numeric day, month, and year
    - **Validates: Requirements 1.1, 1.2**

- [x] 3. Implement GreetingWidget controller
  - [x] 3.1 Implement `Dashboard.GreetingWidget.init`/`stop` with clock interval and DOM updates
    - `init(rootEl)` starts an interval of delay <= 1000ms that reads the system clock, formats time/date, and updates DOM text, recomputing the greeting on each tick so greeting transitions while displayed
    - `stop()` clears the interval; renders greeting, time, and date on init
    - _Requirements: 1.1, 1.2, 1.3, 2.5_

  - [x]* 3.2 Write unit tests for GreetingWidget
    - Create `tests/unit/greeting-widget.test.js`
    - Assert an interval with delay <= 1000ms is registered and updates the time element; assert greeting updates across an injected fake clock boundary; assert `stop()` clears the interval
    - _Requirements: 1.1, 1.3, 2.5_

- [ ] 4. Implement pure timer logic (format and state machine)
  - [ ] 4.1 Implement `Dashboard.timerFormat.format`/`parse` and `Dashboard.timer.transition`
    - `format(seconds 0..1500)` returns `MM:SS` zero-padded; `parse("MM:SS")` returns seconds
    - `transition(state, action)` over `{status, remaining}` for actions `start`/`stop`/`reset`/`tick` enforcing: reset -> `{idle, 1500}`; start from running is a no-op; start from idle/paused with remaining>0 -> running; start with remaining==0 stays stopped; stop from running -> paused preserving remaining; tick with remaining>1 decrements and stays running; tick with remaining==1 -> `{completed, 0}`
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 4.2 Write property test for timer MM:SS formatting round trip
    - Create `tests/properties/p03-timer-format.test.js`
    - **Property 3: Timer MM:SS formatting round trip** — generate `s` in `0..1500`; assert `format(s)` matches `/^\d{2}:\d{2}$/` and `parse(format(s))` equals `s`
    - **Validates: Requirements 3.2**

  - [x]* 4.3 Write property test for timer reset totality
    - Create `tests/properties/p04-timer-reset.test.js`
    - **Property 4: Timer reset is total** — generate random timer states; assert `transition(st, "reset")` equals `{ status: "idle", remaining: 1500 }`
    - **Validates: Requirements 3.1, 4.3**

  - [x]* 4.4 Write property test for timer stop preserving remaining
    - Create `tests/properties/p05-timer-stop.test.js`
    - **Property 5: Timer stop preserves remaining** — generate running states with remaining in `0..1500`; assert `transition(st, "stop")` equals `{ status: "paused", remaining: st.remaining }`
    - **Validates: Requirements 4.2**

  - [x]* 4.5 Write property test for timer start idempotence while running
    - Create `tests/properties/p06-timer-start.test.js`
    - **Property 6: Timer start is idempotent while running** — generate running states; assert `transition(st, "start")` equals `st` unchanged
    - **Validates: Requirements 4.4**

  - [x]* 4.6 Write property test for timer tick decrementing to zero
    - Create `tests/properties/p07-timer-tick.test.js`
    - **Property 7: Timer tick decrements to zero and stops** — generate running states with remaining>1 (decrements by 1, stays running) and remaining==1 (-> `{completed, 0}`)
    - **Validates: Requirements 3.3, 4.1, 4.5**

- [ ] 5. Implement FocusTimer controller
  - [ ] 5.1 Implement `Dashboard.FocusTimer.init`/`start`/`stop`/`reset` with interval and completion notification
    - `init(rootEl)` renders Start/Stop/Reset controls and sets state to `{idle, 1500}`; arms the audio notification on Start for browser autoplay rules
    - `start`/`stop`/`reset` apply `timer.transition` and schedule/clear a 1-second tick interval that applies `transition(..., "tick")` and formats remaining to the DOM as `MM:SS`
    - On transition to `completed`, stop the interval, display `00:00`, and fire an audible + visual notification exactly once; audio playback wrapped in `try/catch`
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 5.2 Write unit tests for FocusTimer
    - Create `tests/unit/focus-timer.test.js`
    - Assert `format(0)==="00:00"`, `format(1500)==="25:00"`, and out-of-bounds handling; assert reaching zero transitions to `completed`, displays `00:00`, and triggers the notification exactly once
    - _Requirements: 3.2, 3.3, 4.5_

- [ ] 6. Implement pure task logic (validation, list ops, serialization)
  - [ ] 6.1 Implement `Dashboard.taskValidate`, task list mutations, and `Dashboard.serialize.tasks`/`parseTasks`
    - `taskValidate(text)` returns `{valid, error: "empty"|"too_long"|null, trimmed}` where valid iff trimmed length is 1..200
    - Pure `addTask`/`editTask`/`toggleDone`/`deleteTask` list operations (assign id via `crypto.randomUUID()` with timestamp fallback, store trimmed text, preserve count and other tasks)
    - `tasks(list)` JSON-encodes; `parseTasks(json|null)` returns array, normalizing `null`/malformed/`"[]"` to empty list
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.2, 6.3_

  - [x]* 6.2 Write property test for task text validation boundaries
    - Create `tests/properties/p08-task-validate.test.js`
    - **Property 8: Task text validation boundaries** — generate arbitrary strings; assert `valid` iff trimmed length in 1..200, error key matches empty/too_long, and `trimmed` equals `s.trim()`
    - **Validates: Requirements 5.1, 5.2, 5.5, 5.6, 5.7**

  - [x]* 6.3 Write property test for adding a valid task
    - Create `tests/properties/p09-task-add.test.js`
    - **Property 9: Adding a valid task grows the list with trimmed text** — generate random lists and valid strings; assert length grows by 1 and new entry `text` equals `s.trim()`
    - **Validates: Requirements 5.1**

  - [x]* 6.4 Write property test for editing a task
    - Create `tests/properties/p10-task-edit.test.js`
    - **Property 10: Editing a task updates text and preserves count** — assert list length unchanged, target task text equals `s.trim()`, all others unchanged
    - **Validates: Requirements 5.2**

  - [x]* 6.5 Write property test for task completion toggle involution
    - Create `tests/properties/p11-task-toggle.test.js`
    - **Property 11: Task completion toggle is an involution** — assert toggling done twice restores the original value with length and texts unchanged
    - **Validates: Requirements 5.3**

  - [x]* 6.6 Write property test for task deletion idempotence
    - Create `tests/properties/p12-task-delete.test.js`
    - **Property 12: Task deletion is idempotent and removes the target** — assert double-delete equals single delete; present id removes it, absent id leaves list unchanged
    - **Validates: Requirements 5.4**

  - [x]* 6.7 Write property test for task serialization round trip
    - Create `tests/properties/p13-task-serialize.test.js`
    - **Property 13: Task serialization round trip** — assert `parseTasks(tasks(L))` deep-equals `L`; `parseTasks(null)` and `parseTasks("[]")` equal empty list
    - **Validates: Requirements 6.1, 6.2, 6.3, 10.1, 10.3**

- [ ] 7. Implement Storage service
  - [ ] 7.1 Implement `Dashboard.Storage.get`/`set`/`remove` with quota handling
    - `get(key)` wraps `JSON.parse(localStorage.getItem(key))` in try/catch, returns `null` on missing/malformed
    - `set(key, value)` wraps `localStorage.setItem` in try/catch, returns `true` on success and `false` on `QuotaExceededError`/unavailability, never throws
    - `remove(key)` deletes the key; storage keys `tld.tasks` and `tld.links`
    - _Requirements: 6.1, 8.1, 10.1, 10.3, 10.4_

  - [x]* 7.2 Write property test for storage write failure not throwing
    - Create `tests/properties/p17-storage-failure.test.js`
    - **Property 17: Storage write failure does not throw** — inject a fake `localStorage` whose `setItem` throws; assert `Storage.set(key, value)` returns `false` and does not throw
    - **Validates: Requirements 10.4**

- [ ] 8. Implement TodoList controller
  - [ ] 8.1 Implement `Dashboard.TodoList.init`/`addTask`/`editTask`/`toggleDone`/`deleteTask` with rendering and persistence
    - `init(rootEl)` loads tasks from `Storage` (empty array when none) and renders; tasks display text and done status with add/edit/complete/delete controls
    - `addTask`/`editTask` run `taskValidate` first; on failure render an inline error (empty/too_long), keep list and storage unchanged, return `{ok:false, error}`; on success mutate the in-memory list, persist via `Storage`, re-render, return `{ok:true}`
    - `toggleDone`/`deleteTask` update status/remove and persist; on `Storage.set` returning false, render a non-blocking "Storage full" banner without crashing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 10.1, 10.3, 10.4, 12.2_

  - [x]* 8.2 Write unit/integration tests for TodoList
    - Create `tests/unit/todo-list.test.js`
    - Assert `addTask` updates the rendered DOM and persists to a fake Local Storage; empty/whitespace and >200-char inputs are rejected with an inline error; persistence round trip via re-init restores count, texts, and done statuses; quota failure shows a banner without crashing
    - _Requirements: 5.1, 5.5, 5.7, 6.1, 6.2, 6.3, 10.4_

- [ ] 9. Implement pure quick link logic (validation and serialization)
  - [ ] 9.1 Implement `Dashboard.linkValidate` and `Dashboard.serialize.links`/`parseLinks`
    - `linkValidate(name, url, count)` returns `{valid, error: "empty_name"|"empty_url"|"bad_scheme"|"limit"|null}` where valid iff name trimmed non-empty, url trimmed non-empty, url starts with `http://` or `https://`, and count < 50
    - `links(list)` JSON-encodes; `parseLinks(json|null)` returns array, normalizing `null`/malformed/`"[]"` to empty list
    - _Requirements: 7.1, 7.3, 7.4, 8.2, 8.3_

  - [x]* 9.2 Write property test for quick link validation rules
    - Create `tests/properties/p14-link-validate.test.js`
    - **Property 14: Quick link validation rules** — generate arbitrary name/url/count; assert `valid` iff name trimmed non-empty, url trimmed non-empty, url starts with `http://`/`https://`, and count < 50; error identifies the first failing rule
    - **Validates: Requirements 7.4**

  - [x]* 9.3 Write property test for quick link serialization round trip
    - Create `tests/properties/p15-link-serialize.test.js`
    - **Property 15: Quick link serialization round trip** — assert `parseLinks(links(L))` deep-equals `L`; `parseLinks(null)` and `parseLinks("[]")` equal empty list
    - **Validates: Requirements 8.1, 8.2, 8.3, 10.1, 10.3**

  - [x]* 9.4 Write property test for quick link deletion idempotence
    - Create `tests/properties/p16-link-delete.test.js`
    - **Property 16: Quick link deletion is idempotent and removes the target** — assert double-delete equals single delete; present id removes it, absent id leaves list unchanged
    - **Validates: Requirements 7.3**

- [ ] 10. Implement QuickLinks controller
  - [ ] 10.1 Implement `Dashboard.QuickLinks.init`/`addLink`/`deleteLink`/`openLink` with rendering, persistence, and `window.open`
    - `init(rootEl)` loads links from `Storage` (empty array when none) and renders buttons; `addLink` runs `linkValidate` first, on failure renders an inline error and returns `{ok:false, error}`, on success persists and re-renders
    - `openLink(id)` calls `window.open(url, "_blank", "noopener")` guarding against popup blockers without assuming a return value; `deleteLink` persists removal
    - On `Storage.set` returning false, render a non-blocking "Storage full" banner without crashing
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 10.1, 10.3, 10.4, 12.3_

  - [x]* 10.2 Write unit/integration tests for QuickLinks
    - Create `tests/unit/quick-links.test.js`
    - Assert `addLink` appends a button and persists to a fake Local Storage; invalid schemes (`ftp://`, `javascript:`), empty name/url, and count==50 are rejected; clicking a link calls mocked `window.open` with the URL and `"_blank"`; persistence round trip restores names and URLs
    - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.2_

- [ ] 11. Wire app together and run smoke tests
  - [ ] 11.1 Implement DOMContentLoaded wiring connecting all controllers to their root elements
    - Register a `DOMContentLoaded` listener that initializes GreetingWidget, FocusTimer, TodoList, and QuickLinks against their root elements and loads persisted tasks/links
    - End of wiring yields an integrated app with no orphaned code; all four widgets render and operate
    - _Requirements: 1.1, 3.1, 5.1, 7.1, 6.1, 8.1, 10.3, 11.2_

  - [x]* 11.2 Write integration/smoke tests
    - Create `tests/integration/smoke.test.js`
    - Assert load with empty Local Storage renders zero tasks/links with no errors (6.3, 8.3, 10.3); persistence round trip restores state (6.1, 6.2, 8.1, 8.2); `index.html` links `css/styles.css` and `js/app.js` with no inline style/script and no external framework references (9.1-9.4); the HTML loads and all widgets render under `file://` (11.2); computed font-size >= 16px and contrast >= 4.5:1 with distinct non-overlapping widget boundaries (13.1-13.3)
    - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 10.3, 11.2, 13.1, 13.2, 13.3_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; they are still included in the dependency graph so the schedule stays valid if run.
- Each implementation task references specific acceptance criteria (e.g., `5.1`) for traceability from requirements through design to code.
- Pure-logic tasks (2.1, 4.1, 6.1, 9.1) have no DOM or storage access; property tests exercise them directly via `window.Dashboard.*` in jsdom.
- Controllers (3.1, 5.1, 8.1, 10.1) call pure functions and apply results to the DOM and Local Storage; unit/integration tests use a fake `localStorage` and mocked `window.open`.
- All production behavior lives in three files (`index.html`, `css/styles.css`, `js/app.js`) with no build step; `package.json`/`vitest.config.js` exist only for the test harness.
- Browser compatibility (Requirement 11.1) and performance timings (Requirements 12.1-12.3) require manual cross-browser verification as noted in the design's testing strategy; full WCAG validation requires manual testing with assistive technologies.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1"] },
    { "id": 8, "tasks": ["8.2", "9.1"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4", "10.1"] },
    { "id": 10, "tasks": ["10.2", "11.1"] },
    { "id": 11, "tasks": ["11.2"] }
  ]
}
```
