"use client";

import { usePathname } from "next/navigation";
import { useBreadcrumbContext } from "@/contexts/breadcrumb-context";

export type BreadcrumbSegment = {
	label: string;
	href: string;
	isLast: boolean;
	/**
	 * True when the segment looks like a dynamic ID (UUID, numeric, slug)
	 * but its label hasn't been registered yet.
	 * Use this to render a loading shimmer in the breadcrumb.
	 */
	isLoading: boolean;
};

/**
 * Detects if a segment looks like a dynamic ID rather than a named route.
 * UUIDs, numeric IDs, cuid/nanoid/short hashes all match.
 */
function isDynamicId(segment: string): boolean {
	if (
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
			segment,
		)
	)
		return true;
	if (/^\d+$/.test(segment)) return true;
	if (/^[a-zA-Z0-9_-]{12,}$/.test(segment) && !/^[a-z-]+$/.test(segment))
		return true;
	return false;
}

/**
 * Converts a URL segment into a readable Title Case label.
 *
 * @example
 * "user-profile"  → "User Profile"
 * "mySettings"    → "My Settings"
 * "order_history" → "Order History"
 */
function formatSegment(segment: string): string {
	return segment
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

/**
 * Generates breadcrumb segments from the current pathname.
 *
 * Reads directly from the registry Map — when `useBreadcrumbLabel` registers a
 * new label, the Map reference changes, which triggers a re-render here automatically.
 *
 * Resolution per segment:
 *   1. Registry lookup (covers both static defaults and runtime-registered IDs)
 *   2. Auto-format fallback  →  "my-route" → "My Route"
 *
 * @param appName - Label for the root "home" crumb, links to "/"
 *
 * @example
 * ```tsx
 * const crumbs = useBreadcrumbs(APP_NAME);
 * ```
 */
export function useBreadcrumbs(appName: string): BreadcrumbSegment[] {
	const pathname = usePathname();
	const { registry } = useBreadcrumbContext();

	const rawSegments = pathname.split("/").filter(Boolean);

	const segments: BreadcrumbSegment[] = [
		{
			label: appName,
			href: "/",
			isLast: rawSegments.length === 0,
			isLoading: false,
		},
	];

	let accumulatedPath = "";

	rawSegments.forEach((segment, index) => {
		accumulatedPath += `/${segment}`;
		const key = segment.toLowerCase();
		const resolvedLabel = registry.get(key);
		const dynamic = isDynamicId(segment);

		segments.push({
			label: resolvedLabel ?? formatSegment(segment),
			href: accumulatedPath,
			isLast: index === rawSegments.length - 1,
			isLoading: dynamic && !resolvedLabel,
		});
	});

	return segments;
}
