import type { EmployeeDetail, PayDistributionResponse } from "@repo/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InsightsService } from "@/services";
import { EmployeePayPosition } from "../EmployeePayPosition";

vi.mock("@/services", () => ({ InsightsService: { distribution: vi.fn() } }));
vi.mock("@/components/insights/PayBoxPlotChart.view", () => ({ PayBoxPlotChart: () => null }));

const employee: EmployeeDetail = { id: "00000000-0000-4000-8000-000000000001", name: "Synthetic employee", countryCode: "US", currencyCode: "USD", department: "Engineering", jobTitle: "Engineer", level: "L3", gender: "woman", hireDate: "2024-01-01", annualBaseMinor: 3_000, bonusTargetBps: 0, bonusMinor: 0, targetMinor: 3_000, status: "active", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", compensationChanges: [] };
const report: PayDistributionResponse = {
	currencyCode: "USD", fxRates: [],
	summary: { headcount: 11, min: 1_000, q1: 2_000, median: 3_000, average: 3_000, q3: 4_000, max: 5_000, lowerWhisker: 1_000, upperWhisker: 5_000, lowerFence: -1_000, upperFence: 7_000, outlierCount: 0, smallSample: false },
	employee: { id: employee.id, name: employee.name, status: "active", annualBaseUsd: 3_000, includedInCohort: true, isOutlier: false },
	outliers: { items: [], totalCount: 0, page: 1, pageSize: 25 },
};
let cache: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => { vi.resetAllMocks(); cache = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); cache.clear(); });

describe("employee peer comparison consistency", () => {
	it("does not relabel old cohort values while the next group is loading", async () => {
		let resolve!: (value: PayDistributionResponse) => void;
		const pending = new Promise<PayDistributionResponse>(done => { resolve = done; });
		vi.mocked(InsightsService.distribution).mockResolvedValueOnce(report).mockReturnValueOnce(pending);
		render(<EmployeePayPosition employee={employee} />, { wrapper });
		await screen.findByText("11 active in United States · USD");
		fireEvent.click(screen.getByRole("button", { name: "Department" }));
		await waitFor(() => expect(InsightsService.distribution).toHaveBeenLastCalledWith({ department: "Engineering", employeeId: employee.id, page: 1, pageSize: 25 }));
		expect(screen.queryByText("11 active in Engineering · USD")).toBeNull();
		expect(screen.getByRole("status", { name: "Loading comparison" })).not.toBeNull();
		await act(async () => { resolve({ ...report, summary: { ...report.summary!, headcount: 6 } }); await pending; });
		await screen.findByText("6 active in Engineering · USD");
	});

	it("uses refreshed profile values for the selected comparison dimension", async () => {
		vi.mocked(InsightsService.distribution).mockResolvedValue(report);
		const { rerender } = render(<EmployeePayPosition employee={employee} />, { wrapper });
		await screen.findByText("11 active in United States · USD");
		rerender(<EmployeePayPosition employee={{ ...employee, countryCode: "CA", currencyCode: "CAD" }} />);
		await waitFor(() => expect(InsightsService.distribution).toHaveBeenLastCalledWith({ countryCode: "CA", employeeId: employee.id, page: 1, pageSize: 25 }));
	});
});
