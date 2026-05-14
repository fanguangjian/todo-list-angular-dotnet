# Frontend Test Results

**Runner:** Vitest v4.1.6  
**Date:** 2026-05-14  
**Command:** `ng test --watch=false`

## Summary

| | |
|---|---|
| Test Files | 3 passed |
| Tests | 20 passed |
| Duration | ~5s |

## Test Files

### `src/app/app.spec.ts` — App (2 tests)

| # | Test | Status |
|---|---|---|
| 1 | should create the app | PASS |
| 2 | should render "Field Jobs" in the toolbar | PASS |

---

### `src/app/api/api-response.interceptor.spec.ts` — apiResponseInterceptor (4 tests)

| # | Test | Status |
|---|---|---|
| 1 | unwraps the data field from a wrapped API response | PASS |
| 2 | unwraps a wrapped object response | PASS |
| 3 | passes through a non-wrapped array response unchanged | PASS |
| 4 | passes through a null body unchanged | PASS |

---

### `src/app/todo-list/todo-list.spec.ts` — TodoList (14 tests)

#### Rendering (4 tests)

| # | Test | Status |
|---|---|---|
| 1 | creates the component | PASS |
| 2 | shows the job board when a user is logged in | PASS |
| 3 | shows the welcome screen when no user is selected | PASS |
| 4 | renders one row per todo item | PASS |

#### Delete confirmation (4 tests)

| # | Test | Status |
|---|---|---|
| 5 | sets pendingDeleteId when Delete is clicked | PASS |
| 6 | shows confirm/cancel UI after Delete is clicked | PASS |
| 7 | clears pendingDeleteId when cancel is clicked | PASS |
| 8 | removes the item and clears pendingDeleteId on confirm | PASS |

#### Sections computed signal (4 tests)

| # | Test | Status |
|---|---|---|
| 9  | splits active and completed into labelled sections when both exist | PASS |
| 10 | shows no section headers when all jobs are active | PASS |
| 11 | filters to active only when filter is "active" | PASS |
| 12 | filters to completed only when filter is "completed" | PASS |

#### Stats counters (2 tests)

| # | Test | Status |
|---|---|---|
| 13 | remaining() counts only active items | PASS |
| 14 | hasCompleted() is false when no items are done | PASS |
