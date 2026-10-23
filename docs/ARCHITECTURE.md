# Application architecture

Planned deployment: one Hostinger VPS, with **Caddy** as the reverse proxy and SQLite on persistent disk. This describes the intended system, not an already verified deployment.

```mermaid
flowchart TB
    subgraph Browser["HR manager's browser"]
        UI["React UI<br/>Directory, employee forms, history, insights"]
        Query["TanStack Query hooks"]
        Service["Frontend service layer"]
        Client["ApiClient"]
        UI --> Query --> Service --> Client
    end

    subgraph VPS["Hostinger VPS"]
        Caddy["Caddy<br/>HTTPS termination and reverse proxy"]
        Next["Next.js process<br/>App Router and UI delivery"]

        subgraph Server["NestJS process · /api prefix"]
            Controllers["Controllers and DTO validation"]
            Employees["Employee service<br/>CRUD, termination, compensation history"]
            Export["CSV export<br/>Shared directory filter logic"]
            Insights["Insights queries<br/>Grouping, distribution, gender comparisons"]
            Prisma["Prisma client / SQLite adapter<br/>Parameterized SQL for reporting"]
            Controllers --> Employees
            Controllers --> Export
            Controllers --> Insights
            Employees --> Prisma
            Export --> Prisma
            Insights --> Prisma
        end

        subgraph Disk["Persistent disk"]
            DB[("SQLite database<br/>Employee · CompensationChange · FxRate")]
        end

        Setup["Migration and seed commands"]
        Backup["Backup procedure<br/>Consistent SQLite snapshot"]

        Caddy -->|"Page requests"| Next
        Caddy -->|"/api/* · preserve prefix"| Controllers
        Prisma <-->|"Reads, writes, transactions, SQL aggregates"| DB
        Setup --> DB
        DB -.-> Backup
    end

    UI -->|"HTTPS page requests"| Caddy
    Client <-->|"HTTPS · JSON and CSV · same origin"| Caddy
    Next -->|"Pages and UI assets via Caddy"| UI
```

- Caddy serves one public origin, routing `/api/*` to NestJS without stripping its global prefix and other application requests to Next.js. The browser uses that origin for API requests.
- Only NestJS accesses employee data during normal application use. Next.js does not connect to the database.
- Pagination, search, filtering, FX conversion for reports, and aggregations run on the server/database. The browser receives page-sized records or reporting results.
- Compensation updates and history inserts share a transaction. Export reuses directory filtering rules so downloaded records match the selected filters.
- The logical service boxes describe responsibilities within one backend, not separate deployed services. No authentication, external FX service, cache service, or background job service is in scope.
- Server unit tests cover isolated business rules; SQLite integration tests cover queries, persistence, and transaction behavior. UI verification is manual for now.
- Production process management, backup scheduling/destination, and restore verification are deployment tasks tracked in [the plan](PLAN.md#9-release-and-submission).
