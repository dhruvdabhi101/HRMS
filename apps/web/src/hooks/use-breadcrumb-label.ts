"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/contexts/breadcrumb-context";

/**
 * Call this hook inside any page or component to register a human-readable
 * label for a dynamic path segment (ID, slug, etc.).
 *
 * The breadcrumb will automatically display the label instead of the raw ID
 * as soon as it is registered.
 *
 * @param id    - The raw path segment to replace (e.g. "abc-123-uuid")
 * @param label - The human-readable label to show (e.g. "John Doe")
 *
 * @example — inside a dynamic page:
 * ```tsx
 * // app/(main)/users/[userId]/page.tsx
 * export default function UserPage({ params }: { params: { userId: string } }) {
 *   const { data: user } = useGetUser(params.userId);
 *
 *   // Once user loads, breadcrumb shows "John Doe" instead of "abc-123"
 *   useBreadcrumbLabel(params.userId, user?.name);
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example — nested dynamic segments:
 * ```tsx
 * // app/(main)/users/[userId]/posts/[postId]/page.tsx
 * useBreadcrumbLabel(params.userId, user?.name);   // Users / John Doe / Posts / ...
 * useBreadcrumbLabel(params.postId, post?.title);  // Users / John Doe / Posts / My Post
 * ```
 */
export function useBreadcrumbLabel(
	id: string | undefined,
	label: string | undefined | null,
): void {
	const { registerLabel } = useBreadcrumbContext();

	useEffect(() => {
		if (id && label) {
			registerLabel(id, label);
		}
	}, [id, label, registerLabel]);
}
