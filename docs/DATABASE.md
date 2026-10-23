# Database diagram

Proposed SQLite model for [the requirements](REQUIREMENTS.md). Field names and storage choices are design proposals until implemented; open calculation rules are tracked in [the plan](PLAN.md#1-settle-product-and-calculation-rules).

```mermaid
erDiagram
    FxRate ||--o{ Employee : "converts current pay to USD"
    Employee ||--o{ CompensationChange : "retains compensation history"

    Employee {
        string id PK "UUID"
        string name
        string countryCode
        string department
        string jobTitle
        string level
        string gender "Including undisclosed; values TBD"
        datetime hireDate
        string status "active or terminated"
        string currencyCode FK
        int annualBaseMinor "Annual base in local minor units"
        int bonusTargetBps "100 basis points = 1 percent"
        datetime createdAt
        datetime updatedAt
    }

    CompensationChange {
        string id PK "UUID"
        string employeeId FK
        int oldBaseMinor "Nullable for initial entry"
        int newBaseMinor
        int oldBonusBps "Nullable for initial entry"
        int newBonusBps
        string oldCurrencyCode "Nullable for initial entry"
        string newCurrencyCode
        datetime changedAt
    }

    FxRate {
        string currencyCode PK "ISO currency code"
        number rateToUsd "USD per local major unit; storage TBD"
        datetime asOfDate "Fixed reference date"
    }
```

- Current compensation lives on Employee. Bonus amounts and USD compensation are derived rather than stored.
- The server validates country/currency mapping and controlled department, title, and level values. Separate management tables are not proposed for v1.
- Updating compensation and appending history happen in one database transaction. An unchanged save adds no history entry; an initial entry with null previous values is proposed.
- History stores old/new currency snapshots alongside amounts so a later currency change cannot relabel past pay. Currency snapshot fields do not reference mutable FX rates.
- Termination changes employee status; employee and history records remain. Insights exclude terminated employees.
- The diagram describes compensation history, not a general audit trail for profile edits. FX precision, rounding, and currency-change rules must be settled before implementation.
- Indexes should support measured directory queries and history retrieval by employee/time; they are not all shown in this logical diagram.
