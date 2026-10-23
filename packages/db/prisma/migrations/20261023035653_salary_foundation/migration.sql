-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "hireDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currencyCode" TEXT NOT NULL,
    "annualBaseMinor" INTEGER NOT NULL,
    "bonusTargetBps" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "FxRate" ("currencyCode") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompensationChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "oldBaseMinor" INTEGER,
    "newBaseMinor" INTEGER NOT NULL,
    "oldBonusBps" INTEGER,
    "newBonusBps" INTEGER NOT NULL,
    "oldCurrencyCode" TEXT,
    "newCurrencyCode" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompensationChange_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FxRate" (
    "currencyCode" TEXT NOT NULL PRIMARY KEY,
    "usdRateMicros" INTEGER NOT NULL,
    "asOfDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Employee_status_name_id_idx" ON "Employee"("status", "name", "id");

-- CreateIndex
CREATE INDEX "Employee_countryCode_status_idx" ON "Employee"("countryCode", "status");

-- CreateIndex
CREATE INDEX "Employee_department_status_idx" ON "Employee"("department", "status");

-- CreateIndex
CREATE INDEX "Employee_jobTitle_status_idx" ON "Employee"("jobTitle", "status");

-- CreateIndex
CREATE INDEX "Employee_level_status_idx" ON "Employee"("level", "status");

-- CreateIndex
CREATE INDEX "Employee_currencyCode_idx" ON "Employee"("currencyCode");

-- CreateIndex
CREATE INDEX "CompensationChange_employeeId_changedAt_id_idx" ON "CompensationChange"("employeeId", "changedAt", "id");
