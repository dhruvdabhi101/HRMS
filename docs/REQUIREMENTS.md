# ACME Salary Management: Requirements

## Problem
ACME's HR team manages salary data for ~10,000 employees across multiple countries in Excel. Editing is tedious and error-prone, there is no change history, and answering "how do we pay people?" means building one-off pivot tables.

## Goal
Give the HR manager a web app to **maintain salary data** and **answer pay questions** (aggregations, comparisons, distributions) across the org, without spreadsheets.

**Questions the HR manager should be able to answer in a few clicks:**
- What is the median pay for L3 engineers in India vs the US?
- What do Engineering and Sales cost us in total, in USD?
- How wide is the pay spread within a level, and who are the outliers?
- Do women and men at the same level get paid the same?

## User
A single HR manager. No other roles.

## Data model
- **Employee:** name, country, department, job title, level, gender, hire date, status (active / terminated).
- **Compensation:** annual base salary in local currency + bonus target as % of base (bonus amount is derived).
- **Currency:** salaries are stored in local currency; a static FX table converts to USD for cross-country comparison.
- **Audit log:** every salary change is recorded (old value, new value, timestamp).

## Features (in scope)
1. **Employee directory:** paginated, searchable table of ~10k employees, filterable by country, department, job title and level.
2. **Manage employees:** add, edit and delete employees. Delete is a soft delete (marked terminated) so history is kept.
3. **Salary history:** the employee detail page shows a timeline of salary changes from the audit log.
4. **Export:** download the current filtered view as CSV.
5. **Pay insights** (active employees only; terminated employees are excluded):
   - **Group-by explorer:** pick 1–2 dimensions (country, department, level, title) and a metric (headcount, min, median, avg, max, total cost) and see the result as a table and a chart, in USD.
   - **Pay distribution:** spread of salaries within a chosen group, with outliers visible.
   - **Gender pay gap:** median pay by gender within the same level, so the comparison is like-for-like.
6. **Seed data:** a script that generates ~10k realistic employees across several countries, so the app can be demoed.

## Non-functional
- **Performance:** the employee list loads in under 300 ms at 10k rows. Pagination, search and filters run on the server.
- **Aggregations run in the database** (SQL group-by), never in the browser, so the amount of data sent to the client stays small.
- **Deployment:** a single VPS (Hostinger) with SQLite on its persistent disk, seeded with the 10k employees.

## Deliberately left out
| Left out | Why |
|---|---|
| **Authentication, roles, multi-user** | One user, and the take-home is about salary management and insight. For real salary data, adding access control would be the first step after the MVP. |
| **Excel/CSV import** | Building a robust import (validation, partial failures, column mapping) is a project of its own. Seeded data demonstrates the same value. Export is kept because it is cheap and useful. |
| **Live FX rates** | They add an external dependency and make numbers drift from day to day. A static rate table keeps reports reproducible. |
| **Bulk raises / comp-cycle tooling** | This changes pay rather than explaining it. It needs previews, approvals and rollback, which is out of proportion for v1. |
| **Salary bands & compa-ratio** | The insights describe what we pay, not what we should pay. Bands would need their own management UI and policy decisions. |

## Assumptions
- Employee and salary data are the source of truth in this app. There is no payroll or HRIS integration.
- FX rates are fixed and are updated manually when needed.
- At ~10k rows, aggregations can run on demand, with no pre-computed reporting tables.
