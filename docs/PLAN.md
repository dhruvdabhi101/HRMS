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
- [ ] Commit the completed behavior with a descriptive message. Keep tests and implementation together in a passing commit.

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

Verification: each rule has a concrete expected-result example in PRODUCT_RULES.md. Runtime tests and performance measurements have not yet been performed.

## 2. Data foundation and repeatable seed

- [ ] Add the minimal employee, compensation history, and static FX schema and required indexes. Keep current compensation on the employee unless a concrete requirement needs separation.
- [ ] Create/apply migrations with `pnpm db:migrate`, then run `pnpm db:generate`.
- [ ] Establish a minimal isolated SQLite test setup using the application schema, with cleanup and no access to development/deployed data.
- [ ] Use TDD for monetary and bonus calculations, including fractional results and rounding boundaries.
- [ ] Build a deterministic seed generating 10,000 employees across countries, departments, titles, levels, genders, and statuses, with plausible salary variation and deliberate outliers.
- [ ] Define safe seed rerun behavior; avoid implicit deletion of existing data.
- [ ] Verify seed count, supported currency relationships, valid compensation, and repeatability; keep the full seed out of routine unit tests.

Verification: a fresh database migrates and seeds successfully, and small deterministic tests establish calculation correctness.

## 3. Create an employee and establish history

- [ ] Test valid employee creation and persisted initial compensation/history according to step 1.
- [ ] Test representative invalid inputs at the API boundary and confirm rejected requests leave no partial records.
- [ ] Implement create/detail endpoints with server validation and clear missing-record responses.
- [ ] Implement the create form and employee detail page using existing frontend patterns and shared components.
- [ ] Manually create an employee, open its detail page, and confirm values and initial history.

Verification: valid creation works end to end; invalid creation cannot persist inconsistent data.

## 4. Employee directory

- [ ] Test server pagination, stable ordering, search, and filters for country, department, title, and level, including combined filters and no matches.
- [ ] Test active/terminated visibility rules, total counts, and invalid query parameters.
- [ ] Implement list and filter-option endpoints without sending the full directory to the browser.
- [ ] Build the directory as the primary entry page, with search, filters, pagination, and links to employee details.
- [ ] Manually verify filter changes reset pagination appropriately and displayed totals match results.
- [ ] Measure representative list requests against 10,000 seeded employees using the agreed performance definition; optimize based on evidence.
- [ ] Deploy this first usable slice to the VPS and verify persistent database storage.

Verification: the directory navigates 10,000 employees correctly and meets the defined performance target.

## 5. Edit compensation and terminate employees

- [ ] Test employee profile edits and valid compensation updates.
- [ ] Test that base or bonus changes record correct previous/new values, while unchanged compensation adds no history entry.
- [ ] Prove compensation and history are atomic using a SQLite integration test that forces a history write failure and verifies rollback.
- [ ] Test termination preserves employee/history data and follows the agreed repeated-termination behavior.
- [ ] Implement update and termination endpoints and reuse create/edit form fields where practical.
- [ ] Add the salary history timeline and termination confirmation explaining that records remain available.
- [ ] Manually verify edit, history, termination, and access to terminated records.

Verification: edits preserve a trustworthy history, failed writes leave data unchanged, and termination never removes history.

## 6. Filtered CSV export

- [ ] Reuse directory filter logic so export includes all matching employees, independent of the visible page.
- [ ] Test filtered record selection, column values, and explicit currency/compensation labels.
- [ ] Test CSV escaping for commas, quotes, and newlines, and safe handling of spreadsheet formula prefixes.
- [ ] Implement the export endpoint and download action.
- [ ] Manually open an exported file and compare it with the active directory filters.

Verification: exported records match the filtered dataset, with valid CSV formatting and safe text cells.

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
