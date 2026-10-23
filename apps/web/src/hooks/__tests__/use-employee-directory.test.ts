import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEmployeeDirectory } from "../use-employee-directory";

vi.mock("@/queries", () => ({ useEmployees: vi.fn(() => ({})) }));
afterEach(cleanup);

function directory(searchParams = "") {
	const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
	const hook = renderHook(() => useEmployeeDirectory(), {
		wrapper: withNuqsTestingAdapter({ searchParams, onUrlUpdate, hasMemory: true }),
	});
	const savedUrl = () => onUrlUpdate.mock.lastCall?.[0].queryString ?? searchParams;
	return { ...hook, savedUrl };
}

describe("employee directory URL state", () => {
	it("restores every table setting from a refreshed URL without resetting its page", async () => {
		const { result } = directory("?page=3&pageSize=50&search=Asha&countryCode=IN&department=R%26D&jobTitle=Engineer&level=L3&status=all&sortBy=department&sortDirection=desc");
		const expected = { page: 3, pageSize: 50, search: "Asha", countryCode: "IN", department: "R&D", jobTitle: "Engineer", level: "L3", status: "all", sortBy: "department", sortDirection: "desc" };
		expect(result.current.search).toBe("Asha");
		expect(result.current.query).toEqual(expected);
		await new Promise(resolve => setTimeout(resolve, 350));
		expect(result.current.query).toEqual(expected);
	});

	it("saves sorting, pagination, and encoded filters so another mount restores them", async () => {
		const first = directory();
		await act(async () => { await first.result.current.changeFilter({ department: "R&D + People" }); });
		await act(async () => { await first.result.current.changeSorting([{ id: "level", desc: true }]); });
		await act(async () => { await first.result.current.changePage(2, 50); });
		const saved = first.savedUrl();
		first.unmount();
		const refreshed = directory(saved);
		expect(refreshed.result.current.query).toMatchObject({ department: "R&D + People", sortBy: "level", sortDirection: "desc", page: 2, pageSize: 50 });
	});

	it("resets the page when filtering and keeps other URL settings", async () => {
		const { result, savedUrl } = directory("?page=4&pageSize=100&countryCode=CA&sortBy=level&sortDirection=desc");
		await act(async () => { await result.current.changeFilter({ level: "L2" }); });
		expect(result.current.query).toMatchObject({ page: 1, pageSize: 100, countryCode: "CA", level: "L2", sortBy: "level", sortDirection: "desc" });
		expect(new URLSearchParams(savedUrl()).has("page")).toBe(false);
	});

	it("clears filters while preserving page size, sorting, and unrelated URL parameters", async () => {
		const { result, savedUrl } = directory("?page=4&pageSize=50&search=Asha&countryCode=IN&department=Sales&jobTitle=Manager&level=L3&status=terminated&sortBy=level&sortDirection=desc&from=bookmark");
		await act(async () => { await result.current.clearFilters(); });
		await waitFor(() => expect(result.current.query.search).toBeUndefined());
		expect(result.current.search).toBe("");
		expect(result.current.query).toMatchObject({ page: 1, pageSize: 50, status: "active", sortBy: "level", sortDirection: "desc" });
		expect(result.current.query.countryCode).toBeUndefined();
		const params = new URLSearchParams(savedUrl());
		expect([...params.keys()].sort()).toEqual(["from", "pageSize", "sortBy", "sortDirection"]);
	});

	it("debounces a new search without losing a filter selected while typing", async () => {
		const { result, savedUrl } = directory("?page=3&search=Old");
		act(() => { result.current.setSearch("New & Name"); });
		expect(result.current.query.search).toBe("Old");
		await act(async () => { await result.current.changeFilter({ countryCode: "US" }); });
		await waitFor(() => expect(result.current.query.search).toBe("New & Name"));
		expect(result.current.query).toMatchObject({ page: 1, countryCode: "US" });
		const saved = new URLSearchParams(savedUrl());
		expect(saved.get("search")).toBe("New & Name");
		expect(saved.get("countryCode")).toBe("US");
	});

	it.each(["0", "-1", "1.5", "2junk", "1e2", "Infinity", "9007199254740991"])("rejects invalid pagination %s instead of requesting it from the API", value => {
		const { result } = directory(`?page=${value}&pageSize=${value}`);
		expect(result.current.query).toMatchObject({ page: 1, pageSize: 25 });
	});

	it("rejects unsupported enumerations and oversized text independently", () => {
		const { result } = directory(`?page=2&pageSize=101&countryCode=XX&level=L9&status=deleted&sortBy=salary&sortDirection=up&search=${"s".repeat(121)}&department=${"d".repeat(101)}&jobTitle=${"j".repeat(101)}`);
		expect(result.current.query).toEqual({ page: 2, pageSize: 25, status: "active", sortBy: "name", sortDirection: "asc", search: undefined, countryCode: undefined, department: undefined, jobTitle: undefined, level: undefined });
	});
});
