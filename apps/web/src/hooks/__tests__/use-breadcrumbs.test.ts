import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";
import { useBreadcrumbs } from "../use-breadcrumbs";

vi.mock("next/navigation", () => ({
	usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

const mockPathname = (path: string) =>
	vi.mocked(usePathname).mockReturnValue(path);

const wrapper = ({ children }: { children: React.ReactNode }) =>
	BreadcrumbProvider({ children, defaults: { profile: "Profile", settings: "Settings" } });

describe("useBreadcrumbs", () => {
	it("returns only root crumb for /", () => {
		mockPathname("/");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current).toHaveLength(1);
		expect(result.current[0]).toMatchObject({ label: "Home", href: "/", isLast: true });
	});

	it("builds crumbs from pathname segments", () => {
		mockPathname("/settings/profile");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current).toHaveLength(3);
		expect(result.current[1]).toMatchObject({ label: "Settings", href: "/settings", isLast: false });
		expect(result.current[2]).toMatchObject({ label: "Profile", href: "/settings/profile", isLast: true });
	});

	it("auto-formats unregistered segments", () => {
		mockPathname("/user-profile");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current[1].label).toBe("User Profile");
	});

	it("marks UUID segment as loading when unregistered", () => {
		mockPathname("/users/550e8400-e29b-41d4-a716-446655440000");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current[2].isLoading).toBe(true);
	});

	it("marks numeric ID segment as loading when unregistered", () => {
		mockPathname("/orders/42");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current[2].isLoading).toBe(true);
	});

	it("does not mark normal slug as loading", () => {
		mockPathname("/settings");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current[1].isLoading).toBe(false);
	});

	it("uses registered default label over auto-format", () => {
		mockPathname("/profile");
		const { result } = renderHook(() => useBreadcrumbs("Home"), { wrapper });
		expect(result.current[1].label).toBe("Profile");
	});
});
