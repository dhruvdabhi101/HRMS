# ACME Salary Management: Implementation Plan

Scope and exclusions are defined in [REQUIREMENTS.md](REQUIREMENTS.md). Build in small, demonstrable slices, using TDD primarily on the server. Check items only after verification; this plan does not mark implementation as complete.

Design references: [database diagram](DATABASE.md) and [application architecture](ARCHITECTURE.md). Deployment uses Caddy as the reverse proxy.

## Working loop for every slice

- [ ] Define one observable behavior and its expected result.
- [ ] Write a meaningful server test and run it; confirm it fails for the expected reason.
- [ ] Implement the smallest change that makes the test pass.
- [ ] Refactor with tests green; repeat for the next behavior.
- [ ] Connect the UI and manually verify the affected workflow and applicable loading, empty, error, and validation states. No new automated UI tests for now.
- [ ] Run relevant tests and `pnpm ready`; inspect the diff for unrelated changes.
- [ ] Commit the completed behavior with a descriptive message. For steps 5–6, the user requested a separate failing test commit before implementation; keep later implementation commits passing.

Use unit tests for isolated business calculations and integration tests with isolated SQLite databases for persistence, queries, and transactions. Prefer small fixtures with hand-calculated answers over the 10,000-row demo dataset. Avoid tests of framework wiring, trivial delegation, private implementation details, or coverage metrics alone.

## 1. Settle product and calculation rules

V1 decisions and worked acceptance examples are recorded in [PRODUCT_RULES.md](PRODUCT_RULES.md). These rules are defined; implementation and executable verification remain in the later steps.

- [x] Define comparison metrics: annual base for comparison statistics; annual target compensation includes target bonus and excludes employer taxes/benefits.
- [x] Define five supported country/currency pairs, synthetic fixed FX rates/date, integer storage, precision, and rounding.
- [x] Define required employee fields, salary/bonus limits, supported levels, gender values, and date validation.
- [x] Define initial history, complete compensation snapshots, unchanged saves, currency changes, and transactional updates.
- [x] Define active-by-default directory visibility, read-only terminated employees, repeatable termination, and active-only insights.
- [x] Define distribution filters, continuous interpolated quartiles, strict 1.5-IQR fences, and small-group behavior.
- [x] Define gender groups, gap formula/reference, missing/zero-reference behavior, counts, and small-sample notes.
- [x] Define API/UI performance boundaries, environment, query cases, sample counts, and percentile reporting.

Verification: each rule has a concrete expected-result example in PRODUCT_RULES.md. Executable checks and performance measurements are tracked in the implementation steps below.

## 2. Data foundation and repeatable seed

- [x] Add the minimal employee, compensation history, and static FX schema and required indexes. Keep current compensation on the employee unless a concrete requirement needs separation.
- [x] Create/apply migrations with `pnpm db:migrate`, then run `pnpm db:generate`.
- [x] Establish a minimal isolated SQLite test setup using the application schema, with cleanup and no access to development/deployed data.
- [x] Use TDD for monetary and bonus calculations, including fractional results and rounding boundaries.
- [x] Build a deterministic seed generating 10,000 employees across countries, departments, titles, levels, genders, and statuses, with plausible salary variation and deliberate outliers.
- [x] Define safe seed rerun behavior; avoid implicit deletion of existing data.
- [x] Verify seed count, supported currency relationships, valid compensation, and repeatability; keep the full seed out of routine unit tests.

Verification: a fresh database migrates and seeds successfully, and small deterministic tests establish calculation correctness.

Verified locally: 10,000 employees (9,090 active / 910 terminated), 10,000 matching initial history entries, and five FX rates. Full generation is repeatable, salary limits and country/currency mappings hold, foreign keys are valid, and seed reruns refuse to overwrite data. SQLite tests verify rollback and history-preserving foreign keys. No API or UI employee workflows are implemented in this step.

## 3. Create an employee and establish history

- [x] Test valid employee creation and persisted initial compensation/history according to step 1.
- [x] Test representative invalid inputs at the API boundary and confirm rejected requests leave no partial records.
- [x] Implement create/detail endpoints with server validation and clear missing-record responses.
- [x] Implement the create form and employee detail page using existing frontend patterns and shared components.
- [x] Manually create an employee, open its detail page, and confirm values and initial history.

Verification: valid creation works end to end; invalid creation cannot persist inconsistent data.

Verified with isolated SQLite HTTP tests: create/detail contracts, required fields, compensation bounds, no numeric-string coercion, valid date-only hire dates, country/currency mapping, unknown IDs, and rollback when initial history fails. Manual browser checks used a separate temporary database: field validation, country configuration errors, retry after a failed save, preserved inputs on network failure, successful navigation and exact compensation display, loading skeletons, missing employees, and narrow layout. No new automated UI tests were added. Directory browsing and existing-value suggestions follow in step 4; editing and termination follow in step 5.

Checks passed: 84 server tests, 15 existing frontend tests, `pnpm ready`, and production builds for both apps.

## 4. Employee directory

- [x] Test server pagination, stable ordering, search, and filters for country, department, title, and level, including combined filters and no matches.
- [x] Test active/terminated visibility rules, total counts, and invalid query parameters.
- [x] Implement list and filter-option endpoints without sending the full directory to the browser.
- [x] Build the directory as the primary entry page, with search, filters, pagination, and links to employee details.
- [x] Manually verify filter changes reset pagination appropriately and displayed totals match results.
- [ ] Measure representative list requests against 10,000 seeded employees using the agreed performance definition; optimize based on evidence.
- [ ] Deploy this first usable slice to the VPS and verify persistent database storage.

Verification: the directory navigates 10,000 employees correctly and meets the defined performance target.

Directory implementation verified locally with 43 SQLite HTTP tests (127 server tests total). Manual browser checks covered active/terminated/all counts, page changes, combined filters resetting to page 1, page-size changes, empty searches, keyboard sorting, employee detail/history links, suggestions, loading, and recovery after a simulated failed request. The 390px layout keeps horizontal scrolling inside the table. Existing frontend tests remain; no new automated UI tests were added.

Decision: reuse `CustomTable` with shadcn presentation and the installed TanStack Table v8. Server pagination renders 25–100 rows rather than loading the full directory; AG Grid's spreadsheet features are outside this scope. Fixed zero-result pagination, controlled sorting/page-size synchronization, and keyboard controls. Exact filters and literal substring search are parameterized SQL; sortable columns come from a fixed allowlist. Page records and total count share a read transaction. Filter options are distinct values across all statuses and also supply create-form suggestions.

Local performance check, 2026-10-23: production NestJS via `pnpm --filter server build` and `start:prod`, Node v24.16.0, macOS / Apple M5 / 24 GiB RAM, isolated SQLite database with the pinned Faker seed and exactly 10,000 employees. HTTP client on the same machine, response body included, no client HTTP cache, unchanged 300/minute rate limit. Five warmups then 50 sequential requests per case; nearest-rank percentiles; zero errors. All requests used page size 25. Initial startup and browser rendering were excluded.

| Query | Matching employees | p50 ms | p95 ms | Max ms |
|---|---:|---:|---:|---:|
| Default first page | 9,090 | 0.58 | 1.59 | 2.19 |
| Literal name search `Aadi` | 15 | 2.03 | 2.67 | 3.05 |
| IN + Engineering + L3 | 46 | 1.69 | 1.90 | 2.05 |
| Page 100 | 9,090 | 0.48 | 0.66 | 0.71 |

These are local baseline measurements, not the agreed deployed acceptance check. Caddy/HTTPS, VPS persistence, and production browser paint timings remain unverified; the two deployment/performance checklist items stay open pending the VPS SSH target and public hostname. Production startup checks also fixed the template's missing direct Express dependency and build output path so `start:prod` runs the compiled application.

Deployment is deferred while the user tests locally. The intended public hostname is `incubyte-test.ruv.world`; keep it configurable through environment variables when adding Caddy deployment configuration. Application URLs are already configured in the server/web `.env` files. Preserve localhost settings for local testing; the VPS SSH target is still unspecified.

## 5. Edit compensation and terminate employees

- [x] Test employee profile edits and valid compensation updates.
- [x] Test that base or bonus changes record correct previous/new values, while unchanged compensation adds no history entry and a wholly unchanged save is rejected.
- [x] Prove compensation and history are atomic using a SQLite integration test that forces a history write failure and verifies rollback.
- [x] Test termination preserves employee/history data and follows the agreed repeated-termination behavior.
- [x] Implement update and termination endpoints and reuse create/edit form fields where practical.
- [x] Add the salary history timeline and termination confirmation explaining that records remain available.
- [x] Manually verify edit, history, termination, and access to terminated records.

Verification: edits preserve a trustworthy history, failed writes leave data unchanged, and termination never removes history.

Verified locally with 61 new SQLite HTTP lifecycle cases and 11 additional create/detail edge cases (199 server tests total). Tests were committed first as `1dc8a78`, with all 61 lifecycle cases failing on the missing endpoints and the other 138 server tests passing. Updates reject empty/normalized unchanged saves, protected fields, nulls, invalid compensation, and edits to terminated employees. Profile-only edits preserve history; base/bonus/currency changes append complete snapshots. A forced SQLite history failure proves profile/pay/history rollback. Repeated termination is a successful no-op, including unchanged timestamps; records and history remain readable.

The create/edit UI shares profile and compensation fields. Country changes clear both pay inputs and require explicit amounts in the destination currency. Manual checks against a temporary SQLite database covered numeric-equivalent unchanged saves, precision errors, valid salary and currency edits, previous/new local history, preserved inputs and retry after network failure, termination confirmation/cancel, termination failure/retry, terminated detail and direct edit URLs, missing records, loading skeletons, active/terminated directory views, and a 390px layout. Existing frontend tests remain; no new automated UI tests were added.

Verification also exposed intermittent HTTP connection failures in the new test fixture when Supertest opened and closed a temporary listener for every request. Keeping the fixture server listening until test teardown removed the observed failure in repeated full-suite runs. Tests retain all business assertions. `pnpm ready`, the complete server/frontend suites, and both production builds passed. Deployment remains deferred.

## 6. Filtered CSV export

- [x] Reuse directory filter logic so export includes all matching employees, independent of the visible page.
- [x] Test filtered record selection, column values, and explicit currency/compensation labels.
- [x] Test CSV escaping for commas, quotes, and newlines, and safe handling of spreadsheet formula prefixes.
- [x] Implement the export endpoint and download action.
- [x] Manually open an exported file and compare it with the active directory filters.

Verification: exported records match the filtered dataset, with valid CSV formatting and safe text cells.

Verified with 48 new isolated SQLite HTTP tests, committed first as `e12c691` with expected failures before implementation. CSV export reuses the directory's parameterized filter/sort builders, includes every matching employee independently of valid pagination inputs, defaults to active status, and validates malformed queries as JSON errors. Columns include all current profile fields and explicitly labelled local annual base, bonus percentage, target bonus, and annual target compensation with exact two-decimal output. Empty selections return a header-only CSV; export changes no records.

Every cell is quoted with doubled embedded quotes and CRLF record separators. Formula-like text, including leading whitespace/control characters and full-width formula prefixes, receives an apostrophe; original Unicode and embedded newlines remain in a single cell. UTF-8 BOM, fixed attachment filename, and no-store headers are set on successful downloads. This is protection for the exported text; spreadsheet save/reopen behavior is application-specific and was not verified in a native spreadsheet application.

Manual browser checks against a temporary 30-employee SQLite fixture verified export from page 2 includes all 28 active employees, Sales filtering exports 14 employees, empty search exports only the header, export waits for pending search/filter requests, failed downloads show an inline error and retry succeeds, and the action fits a 390px viewport. Downloaded files were opened with Python's independent CSV reader to verify row counts, fields, Unicode, quoting/newlines, BOM, and literal formula-like text. All 247 server tests and 15 existing frontend tests, `pnpm ready`, and both production builds passed. No new automated UI tests or dependencies were added.

## 7. Group-by pay explorer

- [ ] Write small SQLite fixtures with independently calculated headcount, min, median, average, max, and total compensation results.
- [ ] Cover odd/even medians, one/two dimensions, mixed currencies, active-only inclusion, filters, and empty results.
- [ ] Validate allowed dimensions/metrics and parameterize query values; never interpolate unchecked SQL identifiers.
- [ ] Implement database-side aggregation and USD conversion, returning only the reporting data needed by the client.
- [ ] Build dimension/metric controls, a result table, and an appropriate chart using existing shadcn chart components.
- [ ] Manually answer the requirements' cross-country median and department cost questions; label base versus target compensation and fixed FX assumptions clearly.

Verification: SQL results match hand-calculated fixtures, and the UI answers both questions in a few interactions.

## 8. Distribution and gender comparisons

- [ ] Test distribution summaries, the agreed quartile/outlier rule, ties, empty groups, and small groups against explicit expected values.
- [ ] Implement database-side distribution calculations and a view that makes the spread and outliers visible.
- [ ] Test median pay by gender within level with country/department filters, group sizes, and the agreed gap/missing-data rules.
- [ ] Implement gender comparison reporting and UI, clearly stating the comparison basis and limitations.
- [ ] Manually verify filtering and empty states, and trace displayed values back to fixture results.

Verification: the HR manager can inspect pay spread and gender differences without misleading grouping or hidden sample sizes.

## 9. Release and submission

- [ ] Run the complete server test suite, existing tests, `pnpm ready`, and production builds; resolve failures caused by the work.
- [ ] Verify a clean checkout can install, configure, migrate, seed, test, and build using documented commands.
- [ ] Finish VPS deployment with production processes, HTTPS, persistent SQLite storage, and a tested backup/restore procedure.
- [ ] Verify deployed employee management, salary history, filtered export, all insights, and 10,000-row performance.
- [ ] Record a concise demo: find an employee, update compensation, inspect history, compare pay groups, and export data.
- [ ] Update setup/deployment instructions and concise decision/AI-use notes with what was actually implemented and verified. Link the deployed app and demo.
- [ ] Review incremental commit history and confirm the repository contains no real employee data, secrets, or database files.

Verification: another person can reproduce the setup and use the deployed application and demo to evaluate every scoped requirement.
