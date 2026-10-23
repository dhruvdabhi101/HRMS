"use client";

import { createContext, useCallback, useContext, useState } from "react";

/**
 * A map of route segment → human-readable label.
 * Keys are lowercase URL segments, values are display labels.
 *
 * @example
 * { settings: "Settings", "my-route": "My Route" }
 */
export type BreadcrumbLabels = Record<string, string>;

type BreadcrumbContextValue = {
	registerLabel: (id: string, label: string) => void;
	registry: Map<string, string>;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

/**
 * Provides the breadcrumb label registry to the entire app.
 *
 * Pass `defaults` to pre-register all known static route labels once.
 * Dynamic labels (IDs, slugs) are registered at runtime by pages via `useBreadcrumbLabel`.
 *
 * Mount this once, high in the tree (e.g. inside your root Providers component).
 *
 * @example
 * ```tsx
 * const ROUTE_LABELS: BreadcrumbLabels = {
 *   settings:  "Settings",
 *   profile:   "Profile",
 *   users:     "Users",
 *   analytics: "Analytics",
 * };
 *
 * <BreadcrumbProvider defaults={ROUTE_LABELS}>
 *   {children}
 * </BreadcrumbProvider>
 * ```
 */
export function BreadcrumbProvider({
	children,
	defaults = {},
}: {
	children: React.ReactNode;
	defaults?: BreadcrumbLabels;
}) {
	const [registry, setRegistry] = useState<Map<string, string>>(
		() => new Map(Object.entries(defaults)),
	);

	const registerLabel = useCallback((id: string, label: string) => {
		const key = id.toLowerCase();
		setRegistry((prev) => {
			if (prev.get(key) === label) return prev;
			const next = new Map(prev);
			next.set(key, label);
			return next;
		});
	}, []);

	return (
		<BreadcrumbContext.Provider value={{ registerLabel, registry }}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumbContext() {
	const ctx = useContext(BreadcrumbContext);
	if (!ctx)
		throw new Error(
			"useBreadcrumbContext must be used inside <BreadcrumbProvider>",
		);
	return ctx;
}
