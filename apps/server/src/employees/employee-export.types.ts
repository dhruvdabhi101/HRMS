import type { Employee } from "@repo/db";

export type EmployeeExportRow = Omit<Employee, "createdAt" | "updatedAt">;
