---
navTitle: Implementation plan
---

# ACME Salary Management: Implementation Plan

Scope and exclusions are defined in [REQUIREMENTS.md](REQUIREMENTS.md). Build in small, demonstrable slices, using TDD primarily on the server. Check items only after verification; this plan does not mark implementation as complete.

Rehire/reactivation of terminated employees and future hires/future joining dates are deliberately excluded from v1. Terminated records stay read-only; creation activates an employee immediately and accepts only a hire date on or before the current UTC date. No scheduled activation or rehire workflow is planned in these steps.

Design references: [database diagram](DATABASE.md) and [application architecture](ARCHITECTURE.md). Deployment uses Caddy as the reverse proxy.

## Working loop for every slice

- [ ] Define one observable behavior and its expected result.
- [ ] Write a meaningful server test and run it; confirm it fails for the expected reason.
- [ ] Implement the smallest change that makes the test pass.
- [ ] Refactor with tests green; repeat for the next behavior.
- [ ] Connect the UI and manually verify the affected workflow and applicable loading, empty, error, and validation states. No new automated UI tests for now.
- [ ] Run relevant tests and `pnpm ready`; inspect the diff for unrelated changes.
- [ ] Commit the completed behavior with a descriptive message. For steps 5–8, the user requested a separate failing test commit before implementation; keep later implementation commits passing.

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
- [x] Deploy this first usable slice to the VPS and verify persistent database storage.

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

These are local baseline measurements, not the agreed deployed acceptance check. Production UI timings and deployment status are recorded under [step 9](#9-release-and-submission). The measurement item stays open until the API boundary is measured from the VPS. Production startup checks also fixed the template's missing direct Express dependency and build output path so `start:prod` runs the compiled application.

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

Overall review since `817d38b`: independent standards/spec passes found repeated export clicks while pending, cache updates skipped when navigating away during a write, and stale form defaults capable of reverting compensation during a profile edit. Seven focused frontend regressions were committed first as `16a8baf` and confirmed failing. Fixes keep loading buttons disabled, perform shared cache updates in mutation hooks, refresh detail before editing, and submit only dirty fields (including explicit base/bonus when country changes). Retry actions also use loading buttons. Manual checks on isolated SQLite data confirmed a delayed save still updates details after Cancel, a name-only save preserves a salary changed by another client while the draft is open, and Export stays disabled during the request. Frontend coverage checks passed without changing coverage configuration; the suite now contains 247 server and 23 frontend tests.

Follow-up standards/spec review identified one remaining response-ordering race: an older detail GET could overwrite a successful save after navigation. A deferred-response regression was committed first as `9e1a8bd` and failed with the old salary in cache. The shared mutation success callback now waits for cancellation of the exact detail query before storing the authoritative employee response. All 23 frontend tests, frontend coverage execution, and `pnpm ready` passed after the fix.

The focused security source review found no confirmed boundary violations. Native spreadsheet interpretation/save-reopen remains unverified; overlap between update and termination, and formula text through create/edit normalization into export, remain additional test coverage opportunities. Low-impact standards notes remain around form-field component suffixes, constant placement, duplicated trim transforms, and seed generator naming. Deployment and later insights remain deferred.

## 7. Group-by pay explorer

- [x] Write small SQLite fixtures with independently calculated headcount, min, median, average, max, and total compensation results.
- [x] Cover odd/even medians, one/two dimensions, mixed currencies, active-only inclusion, filters, and empty results.
- [x] Validate allowed dimensions/metrics and parameterize query values; never interpolate unchecked SQL identifiers.
- [x] Implement database-side aggregation and USD conversion, returning only the reporting data needed by the client.
- [x] Build dimension/metric controls, a result table, and an appropriate chart using existing shadcn chart components.
- [x] Manually answer the requirements' cross-country median and department cost questions; label base versus target compensation and fixed FX assumptions clearly.

Verification: SQL results match hand-calculated fixtures, and the UI answers both questions in a few interactions.

Verified with 49 new isolated SQLite HTTP cases, committed first as `d608ec7`: all 49 failed on the missing endpoint while the existing 247 server tests passed. `GET /api/insights/groups` accepts one or two distinct allowlisted dimensions and one metric, with exact country/department/title/level filters. Reports always exclude terminated employees and compensation history. SQLite performs per-employee half-up local bonus/target and USD conversion, grouping, ranking for medians, and aggregation; the response contains group values in USD cents (or employee counts) and the current FX table/reference dates from the same read transaction. Invalid query identifiers/values and repeated parameters are rejected; string filter values remain bound parameters. Invalid FX rates fail explicitly.

The `/insights` page provides controls, a sortable/paginated group table, and a shadcn/Recharts bar chart. For more than 20 groups, the chart explicitly shows the 20 largest values while the table includes every group. The UI labels annual base versus annual target compensation, active-only inclusion, and synthetic fixed FX assumptions/dates. Pending draft controls are identified until Update report applies them; duplicate dimensions show an inline validation error. Successful employee writes invalidate insights caches.

Manual Chrome checks used a separate seven-employee synthetic SQLite fixture (six active, one terminated). L3 Engineering median base was USD 18,000 in India versus USD 110,000 in the US; annual target compensation totaled USD 296,000 for Engineering and USD 224,000 for Sales. Two-dimension department/country rows matched the hand-calculated subtotals. Verified table/chart rendering, empty selection, duplicate-dimension validation, loading skeletons and disabled submission during a delayed request, report/filter errors with the API unavailable, and successful retry after restoring it. The collaborative browser timed out twice, so these checks used native Chrome. No new automated UI tests were added. All 296 server tests and 23 frontend tests, `pnpm ready`, and both production builds passed. Deployment and step 8 remain deferred.

Final verification exposed intermittent HTTP 401/404 responses from local test listeners. A standalone Node probe reproduced an IPv6 wildcard listener receiving an IPv4 response from a different local service (1 mismatch in 200 probes); Supertest rewrites wildcard IPv6 addresses to IPv4 loopback. All five HTTP fixtures now explicitly listen on `127.0.0.1` until teardown. The same 200-probe check then had zero mismatches, and three consecutive complete server-suite runs passed without weakening assertions. Temporary diagnostic logging, browser tabs, servers, and fixture data were removed.

## 8. Distribution and gender comparisons

- [x] Add an employee pay-position box plot on each detail page, reusing distribution statistics with a highlighted salary, median, average, and explicit cohort membership.
- [x] Test distribution summaries, the agreed quartile/outlier rule, ties, empty groups, and small groups against explicit expected values.
- [x] Implement database-side distribution calculations and a view that makes the spread and outliers visible.
- [x] Test median pay by gender within level with country/department filters, group sizes, and the agreed gap/missing-data rules.
- [x] Implement gender comparison reporting and UI, clearly stating the comparison basis and limitations.
- [x] Manually verify filtering and empty states, and trace displayed values back to fixture results.

Verification: the HR manager can inspect pay spread and gender differences without misleading grouping or hidden sample sizes.

Tests were committed before each implementation (`cd32090`, then `066d110` for peer-comparison freshness and salary-position wording). A synthetic fixture traced displayed values to hand calculations: salaries 10–100 give Q1 20, median 30, Q3 40, upper fence 70, and one outlier at 100; four CAD 100.00 salaries convert to USD 74.00 with no spread; women `[80,000, 100,000]` versus men `[100,000, 120,000]` give an 18.18% gap. Terminated employees are excluded from cohorts but keep a labelled marker. The detail page originally rendered an empty chart because Recharts 3 dropped reference marks when the hidden Y axis had no data; it was fixed and checked in the browser. Following review, the detail page shows a compact plot in the compensation card, comparing only against the employee's own country, department, role, or level; arbitrary filters and the outlier list stay on the distribution report.

## 9. Release and submission

- [x] Run the complete server test suite, existing tests, `pnpm ready`, and production builds; resolve failures caused by the work.
- [x] Verify a clean checkout can install, configure, migrate, seed, test, and build using documented commands.
- [x] Finish VPS deployment with production processes, HTTPS, and persistent SQLite storage. Backup/restore is not implemented and is out of scope by owner decision (2026-10-24).
- [ ] Verify deployed employee management, salary history, filtered export, all insights, and 10,000-row performance.
- [ ] Record a concise demo: find an employee, update compensation, inspect history, compare pay groups, and export data.
- [ ] Update setup/deployment instructions and concise decision/AI-use notes with what was actually implemented and verified. Link the deployed app and demo.
- [x] Review incremental commit history and confirm the repository contains no real employee data, secrets, or database files.

Verification: another person can reproduce the setup and use the deployed application and demo to evaluate every scoped requirement.

Release checks, 2026-10-24:

- **Suites:** 350 server and 47 frontend tests, `pnpm ready`, and both production builds passed.
- **Clean checkout:** a fresh clone following the README failed at `pnpm db:seed` and in 11 server test files, because `@repo/shared` resolves to a gitignored `dist/` that only `pnpm package` or `pnpm build` creates. The README now runs `pnpm package` after `pnpm db:generate`. With that step, the clone seeded 10,000 employees, 10,000 history rows, and 5 FX rates, and all 350 server tests passed.
- **Deployment:** Caddy serves both hostnames over HTTPS (HTTP/2); PM2 runs `hrms-server` and `hrms-web`. The owner confirmed persistence: redeploys run `db:deploy` but never seed, and the gitignored SQLite file is untouched by `git pull` (procedure in the README). Production holds 10,001 employees: the 10,000-row seed plus one created after it. Automatic restart after a VPS reboot (`pm2 startup`/`pm2 save`) is not set up; after a reboot the apps must be started manually.
- **Deployed smoke check (read-only):** directory, detail with history and peer box plot, filtered CSV export (46 rows for IN + Engineering + L3, matching the directory), group explorer, distribution, and gender comparison all worked. The US median was USD 118,099.20 in both the group explorer and distribution reports. Create, edit, and terminate were not exercised against production data.
- **Repository:** gitleaks found no leaks in 49 commits; no database, env, or data-export files are tracked.

UI list performance, 2026-10-24, against production (10,001 employees, page size 25). Chrome 155 (headless, driven by Playwright) on macOS / Apple M5, about 15 ms TCP connect to the VPS. Each sample is a full reload with a warm HTTP cache and the production rate limit unchanged; 5 warmups then 20 samples per case, no errors. Measured from the browser starting the `/api/employees` request until the frame after the expected rows and count line committed. Nearest-rank percentiles:

| Case | p50 ms | p95 ms | Max ms |
|---|---:|---:|---:|
| Default first page | 38.8 | 46.2 | 46.6 |
| Literal search `Aadi` | 43.1 | 58.7 | 64.1 |
| IN + Engineering + L3 | 52.2 | 66.3 | 71.7 |
| Page 100 | 37.0 | 49.6 | 69.0 |

Every case meets the 300 ms UI target. Request-to-response alone was p95 32.5–57.6 ms from this machine. Initial page load (navigation start to rows painted) was p95 104–313 ms; it is reported separately and is not part of the target. The API boundary (an HTTP client on the VPS through Caddy, p95 below 200 ms) has not been measured because it needs VPS access.
