import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BreadcrumbProvider, useBreadcrumbContext } from "@/contexts/breadcrumb-context";
import { useBreadcrumbLabel } from "../use-breadcrumb-label";
import React from "react";

const wrapper = ({ children }: { children: React.ReactNode }) =>
	React.createElement(BreadcrumbProvider, null, children);

describe("useBreadcrumbLabel", () => {
	it("registers a label into the context", () => {
		const { result } = renderHook(
			() => {
				useBreadcrumbLabel("abc-123", "John Doe");
				return useBreadcrumbContext();
			},
			{ wrapper },
		);
		expect(result.current.registry.get("abc-123")).toBe("John Doe");
	});

	it("does not register when id is undefined", () => {
		const { result } = renderHook(
			() => {
				useBreadcrumbLabel(undefined, "John Doe");
				return useBreadcrumbContext();
			},
			{ wrapper },
		);
		expect(result.current.registry.size).toBe(0);
	});

	it("does not register when label is undefined", () => {
		const { result } = renderHook(
			() => {
				useBreadcrumbLabel("abc-123", undefined);
				return useBreadcrumbContext();
			},
			{ wrapper },
		);
		expect(result.current.registry.size).toBe(0);
	});

	it("re-registers when label changes", () => {
		const { result, rerender } = renderHook(
			({ label }: { label: string }) => {
				useBreadcrumbLabel("abc-123", label);
				return useBreadcrumbContext();
			},
			{ wrapper, initialProps: { label: "Initial" } },
		);

		expect(result.current.registry.get("abc-123")).toBe("Initial");

		act(() => rerender({ label: "Updated" }));

		expect(result.current.registry.get("abc-123")).toBe("Updated");
	});
});
