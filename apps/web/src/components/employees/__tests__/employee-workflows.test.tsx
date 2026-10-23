import type { CreateEmployeeInput, EmployeeDetail } from "@repo/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEmployeeForm } from "@/hooks/use-employee-form";
import { EMPLOYEE_KEYS, useCreateEmployee, useEmployee, useEmployees, useTerminateEmployee, useUpdateEmployee } from "@/queries";
import { EmployeesService } from "@/services";
import { EmployeeDetail as EmployeeDetailPage } from "../EmployeeDetail";
import { ExportEmployees } from "../ExportEmployees";

vi.mock("@/services", () => ({ EmployeesService: { create: vi.fn(), update: vi.fn(), terminate: vi.fn(), get: vi.fn(), list: vi.fn(), filterOptions: vi.fn(), exportCsv: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/hooks/use-breadcrumb-label", () => ({ useBreadcrumbLabel: vi.fn() }));

const input: CreateEmployeeInput = { name: "Asha", countryCode: "US", department: "Engineering", jobTitle: "Engineer", level: "L3", gender: "woman", hireDate: "2024-02-29", annualBaseMinor: 100_000, bonusTargetBps: 1_000 };
const employee: EmployeeDetail = { ...input, id: "00000000-0000-4000-8000-000000000001", currencyCode: "USD", status: "active", bonusMinor: 10_000, targetMinor: 110_000, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", compensationChanges: [] };
const updated: EmployeeDetail = { ...employee, annualBaseMinor: 200_000, bonusMinor: 20_000, targetMinor: 220_000, updatedAt: "2026-02-01T00:00:00Z" };

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(done => { resolve = done; });
	return { promise, resolve };
}

let cache: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;

beforeEach(() => {
	vi.resetAllMocks();
	cache = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 }, mutations: { retry: false } } });
	vi.mocked(EmployeesService.filterOptions).mockResolvedValue({ departments: [], jobTitles: [] });
});
afterEach(() => { cleanup(); cache.clear(); });

describe("employee workflow regressions", () => {
	it("disables export while pending even when directory controls are enabled", async () => {
		const pending = deferred<string>();
		vi.mocked(EmployeesService.exportCsv).mockReturnValue(pending.promise);
		render(<ExportEmployees query={{ status: "active" }} disabled={false} />, { wrapper });
		const button = screen.getByRole("button", { name: "Export CSV" }) as HTMLButtonElement;
		fireEvent.click(button);
		await waitFor(() => expect(button.disabled).toBe(true));
		fireEvent.click(button);
		expect(EmployeesService.exportCsv).toHaveBeenCalledTimes(1);
	});

	it.each(["create", "update", "terminate"] as const)("keeps detail and directory current when %s finishes after navigation", async operation => {
		const pending = deferred<EmployeeDetail>();
		vi.mocked(EmployeesService[operation]).mockReturnValue(pending.promise);
		vi.mocked(EmployeesService.get).mockResolvedValue(updated);
		const list = { items: [employee], totalCount: 1, page: 1, pageSize: 25 };
		cache.setQueryData(EMPLOYEE_KEYS.detail(employee.id), employee);
		cache.setQueryData(EMPLOYEE_KEYS.list({}), list);
		vi.mocked(EmployeesService.list).mockResolvedValue({ ...list, items: [updated] });
		const mutation = renderHook(() => ({ create: useCreateEmployee(), update: useUpdateEmployee(), terminate: useTerminateEmployee() }), { wrapper });
		act(() => {
			if (operation === "create") mutation.result.current.create.mutate(input);
			else if (operation === "update") mutation.result.current.update.mutate({ id: employee.id, input: { annualBaseMinor: 200_000 } });
			else mutation.result.current.terminate.mutate(employee.id);
		});
		await waitFor(() => expect(EmployeesService[operation]).toHaveBeenCalledTimes(1));
		mutation.unmount();
		await act(async () => { pending.resolve(updated); await pending.promise; });
		const detail = renderHook(() => useEmployee(employee.id), { wrapper });
		const directory = renderHook(() => useEmployees({}), { wrapper });
		await waitFor(() => expect(detail.result.current.data?.annualBaseMinor).toBe(200_000));
		await waitFor(() => expect(directory.result.current.data?.items[0]?.annualBaseMinor).toBe(200_000));
	});

	it("waits for current server values before opening an edit form, even with a fresh cached detail", async () => {
		const pending = deferred<EmployeeDetail>();
		vi.mocked(EmployeesService.get).mockReturnValue(pending.promise);
		cache.setQueryData(EMPLOYEE_KEYS.detail(employee.id), employee);
		render(<EmployeeDetailPage employeeId={employee.id} edit />, { wrapper });
		expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
		await waitFor(() => expect(EmployeesService.get).toHaveBeenCalledTimes(1));
		await act(async () => { pending.resolve(updated); await pending.promise; });
		await screen.findByRole("button", { name: "Save changes" });
		expect((screen.getByLabelText(/Annual base salary/) as HTMLInputElement).value).toBe("2000.00");
	});

	it("sends only changed profile fields if compensation changes while a draft is open", async () => {
		vi.mocked(EmployeesService.update).mockResolvedValue(updated);
		const form = renderHook(({ current }) => useEmployeeForm(current), { wrapper, initialProps: { current: employee } });
		act(() => form.result.current.form.setValue("name", "Changed name", { shouldDirty: true }));
		form.rerender({ current: updated });
		await act(async () => { await form.result.current.submit(); });
		await waitFor(() => expect(vi.mocked(EmployeesService.update).mock.calls[0]?.[0]).toEqual({ id: employee.id, input: { name: "Changed name" } }));
	});
	it("sends explicit base and bonus for a currency change even when their numeric values are unchanged", async () => {
		vi.mocked(EmployeesService.update).mockResolvedValue(updated);
		const form = renderHook(() => useEmployeeForm(employee), { wrapper });
		act(() => form.result.current.form.setValue("countryCode", "CA", { shouldDirty: true }));
		await act(async () => { await form.result.current.submit(); });
		await waitFor(() => expect(vi.mocked(EmployeesService.update).mock.calls[0]?.[0]).toEqual({ id: employee.id, input: { countryCode: "CA", annualBaseMinor: 100_000, bonusTargetBps: 1_000 } }));
	});

});
