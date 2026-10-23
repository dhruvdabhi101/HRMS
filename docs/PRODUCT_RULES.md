# Product and calculation rules

V1 decisions for [plan step 1](PLAN.md#1-settle-product-and-calculation-rules). These define expected behavior for later implementation and tests; they do not claim that features are implemented. Examples use synthetic employees and pay.

## 1. Pay metrics

Reports include active employees only. Headcount counts employees, not compensation changes. Min, median, average, max, distributions, and gender comparisons use annual base salary converted to USD. Median is the middle sorted value, or the average of the two middle values for an even-sized group.

The cost metric is labelled **Annual target compensation**: annual base plus target bonus. It excludes actual bonus payouts, employer taxes, benefits, and payroll costs. It is an annualized snapshot, with no hire-date proration. Empty filtered datasets return no groups, rather than fabricated zero-pay groups.

Acceptance examples:

- USD bases of 100,000 and 120,000 give headcount 2, min 100,000, median/average 110,000, and max 120,000.
- At bonus targets of 10% and 20%, annual target compensation totals USD 254,000. The base metrics remain unchanged.
- Terminating the second employee leaves headcount 1 and target compensation USD 110,000; neither report includes that employee's history entries.

## 2. Money, currencies, and FX

Store annual base as integer local minor units and bonus target as integer basis points (100 basis points = 1%). All supported currencies in v1 have 100 minor units per major unit. Derive currency from country on the server; reject a supplied currency that disagrees with the country.

| Country | Code | Currency | Fixed demo USD per local major unit |
|---|---|---|---:|
| United States | US | USD | 1.000000 |
| India | IN | INR | 0.012000 |
| United Kingdom | GB | GBP | 1.250000 |
| Germany | DE | EUR | 1.100000 |
| Canada | CA | CAD | 0.740000 |

These are synthetic demo rates, not historical or current market quotes. Use the fixed reference date **2026-01-01** and label reports with that date and the demo-rate basis. Store USD per local major unit multiplied by 1,000,000 as a positive integer `usdRateMicros`; USD is 1,000,000. No live FX calls or FX management UI. Manual rate changes must be deliberate, with their reference date updated; reports use the current fixed table, not historical rate reconstruction.

Round halfway up for nonnegative money values. Calculate local bonus minor units as `round(baseMinor × bonusBps / 10,000)`. Local target compensation is base plus that rounded bonus. Convert base and target compensation separately to USD cents as `round(localMinor × usdRateMicros / 1,000,000)`. Aggregate these per-employee USD-cent values. Round average/median outputs to cents only after calculating the statistic; round percentages to two decimal places. Never silently round an input with excess decimal places.

Acceptance examples:

- INR 1,000,000.00 base with 10% bonus gives INR 100,000.00 bonus, USD 12,000.00 base, and USD 13,200.00 target compensation.
- USD 100.05 base with a 10% bonus gives USD 10.01 bonus and USD 110.06 target compensation.
- CAD 100.25 converts to USD 74.19. Two such employees total USD 148.38.
- Median of USD 100.00 and 100.01 is USD 100.005 internally and displays USD 100.01.

## 3. Employee inputs

- Required: name, country, department, job title, level, gender, hire date, annual base, and bonus target. No email or separate employee number is required; UUID identifies the record.
- Trim surrounding whitespace. Name is 1–120 characters; department and job title are 1–100 characters. Preserve non-Latin names and punctuation. Department/title are required text values with existing-value suggestions, not a fixed catalog or new management feature.
- Country must be one of the five supported codes. Levels are L1–L6. Gender values are `woman`, `man`, `non_binary`, and `undisclosed`; undisclosed is an explicit choice, not an inferred value.
- Hire date is a valid date-only `YYYY-MM-DD`, not later than the current UTC date. Store/return it consistently without timezone-induced date shifts.
- Annual base must be greater than zero and at most 10,000,000.00 local major units (1,000,000,000 minor units), with at most two decimal places. This technical v1 limit is not a compensation policy.
- Bonus target must be 0–100%, inclusive, with at most two decimal places. Accept no negative, non-finite, or silently coerced malformed numeric values.
- Creation always sets active status. Invalid requests return field-specific validation errors and persist nothing. Unknown employee IDs return 404.

Acceptance examples: trimmed name `  Asha Rao  ` becomes `Asha Rao`; 0 base, 100.001 base, 100.01% bonus, unsupported country, L7, and an impossible/future hire date are rejected. A 0% bonus is valid. Tests control the clock when checking dates.

## 4. Compensation history and changes

Create an initial history entry with null previous base/bonus/currency and the employee's starting values. Any change to base, bonus, or currency appends one entry containing the complete previous/new compensation snapshot and a server-generated UTC timestamp. Profile-only edits and unchanged saves add no compensation history entry.

Persist the employee update and history insert in one transaction. Snapshot currencies on history entries, and show original local amounts; never reinterpret them using the employee's current currency. Order history newest first with a stable ID tie-breaker when timestamps match. History has no edit/delete API.

When a country change changes currency, require explicit new base and bonus inputs; do not auto-convert or silently carry the old numeric salary into a different currency. Termination itself adds no compensation entry.

Acceptance examples:

- Creation at INR 1,000,000 with 10% bonus creates exactly one initial entry.
- Changing bonus to 12% creates one entry with unchanged base, old bonus 10%, and new bonus 12%. Saving again adds none.
- Renaming the employee creates no compensation entry. A failed history insert rolls back the associated pay change.
- Moving IN → US without explicit new compensation is rejected. Moving with USD 120,000 and 10% records both INR and USD snapshots; the old entry still displays INR.

## 5. Directory and termination

The directory defaults to active employees, with status choices Active, Terminated, and All. Terminated employees are readable, including history, but cannot be edited or reactivated in v1. Termination preserves data; repeating it succeeds without further changes. Attempts to edit a terminated employee return 409.

Default page size is 25, maximum 100; page numbers start at 1. Default ordering is name ascending then ID ascending. Search is a trimmed, literal name substring; it does not treat `%` or `_` as user-supplied wildcards. V1 case folding is SQLite's default ASCII behavior; non-ASCII names remain searchable by their literal text. Country, department, title, level, and status filters combine with AND. Export uses all matching records, not only the current page. Changing a filter/search resets the UI to page 1.

Acceptance example: with two active employees and one terminated employee, default results/count are 2, All returns 3, and Terminated returns 1. The terminated detail/history remains accessible. An out-of-range positive page returns an empty list with the correct total; page 0 is rejected.

## 6. Distribution and outliers

Apply optional country, department, title, and level filters to active employees. Summarize each selected group by count, min, Q1, median, Q3, and max of annual base USD values. Use continuous linear-interpolation percentiles: for sorted values indexed from zero, position is `(n − 1) × p`; interpolate between adjacent values when the position is fractional.

Outliers are strictly below `Q1 − 1.5 × IQR` or above `Q3 + 1.5 × IQR`, where `IQR = Q3 − Q1`. Values exactly on a fence are not outliers. Classify using unrounded quartiles/fences; round only display values. Outlier details identify employees and their pay, with server pagination if needed.

For groups smaller than four, show available summary values but no outlier labels, with an insufficient-sample note. Empty selections show an empty state. Equal salaries have IQR zero and no outliers; for other zero-IQR groups with at least four records, the same strict fence rule applies.

Acceptance examples:

- USD bases `[10, 20, 30, 40, 100]` give Q1 20, median 30, Q3 40, IQR 20, and fences −10/70; only 100 is an outlier.
- `[10, 20, 30, 40]` gives Q1 17.5 and Q3 32.5, with no outliers.
- `[10]` has min/Q1/median/Q3/max 10, but outlier classification is suppressed. `[20, 20, 20, 20]` has no outliers.

## 7. Gender comparison

Show median annual base USD by gender within each level, with optional country, department, and title filters. Always show group sizes. Display non-binary and undisclosed groups with their medians/counts, but exclude them from the women-versus-men percentage calculation. Do not infer gender from names.

Label the comparison **Women's median relative to men's median**. Calculate the gap percentage as `(menMedian − womenMedian) / menMedian × 100` using unrounded medians. Positive means women's median is lower; negative means higher. If either comparison group is absent or the men's median is zero, return no percentage and show “Not available”; do not substitute zero. For either group below five employees, show the result with a small-sample note. This is a descriptive difference, not an adjusted equal-pay conclusion.

Acceptance example: women `[80,000, 100,000]`, men `[100,000, 120,000]`, and one undisclosed employee at 200,000 give medians 90,000/110,000 and gap 18.18%. Counts are 2/2/1, with a small-sample note. The undisclosed salary does not affect the gap. A level with only women shows their median and an unavailable gap.

## 8. List performance acceptance

Keep the original under-300 ms list goal and report two boundaries separately:

- **API:** production build against 10,000 seeded employees on the deployed VPS, including application processing, SQL, and response transfer. Measure from an HTTP client on that VPS through Caddy over HTTPS using the public hostname. Target p95 below 200 ms to leave room for browser work. This is not a remote-user latency claim.
- **UI:** in a production browser session near the VPS region, measure from the list request starting until matching rows are painted. Target p95 below 300 ms, with browser, machine, region, network latency, and measurement method recorded. This excludes initial page assets, typing debounce, and cold application startup; report initial page-load timing separately rather than calling it the same measure.

Use page size 25 and four cases: default first page; literal search with matches; combined country/department/level filters; and a later populated page. After five warmups per case, record 50 sequential API requests per case, without disabling production rate limits or silently dropping slow requests. Record errors, p50, p95 (nearest-rank), and maximum. Check the UI cases manually using browser performance tooling, with at least 20 warm repetitions per case; no automated UI test suite is required. Report cache settings, VPS resources, seed version, and any failures. Do not put wall-clock thresholds in routine unit tests.

Acceptance example: among 50 sorted API timings, p95 is the 48th value. Among 20 UI timings, p95 is the 19th. API p95 of 180 ms with UI p95 of 340 ms passes only the API budget; it does not satisfy the list goal. These are acceptance examples, not measured results.
