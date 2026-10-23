import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { GuideNavItem } from "@/lib/docs/source";

export function GuidePager({
	previous,
	next,
}: {
	previous?: GuideNavItem;
	next?: GuideNavItem;
}) {
	if (!previous && !next) return null;

	return (
		<nav className="border-border mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2">
			{previous ? (
				<Link
					href={previous.href}
					className="border-border hover:bg-accent group flex flex-col gap-1 rounded-lg border p-4 transition-colors"
				>
					<span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
						<ChevronLeft className="size-3" />
						Previous
					</span>
					<span className="text-sm font-medium">{previous.title}</span>
				</Link>
			) : (
				<span />
			)}
			{next && (
				<Link
					href={next.href}
					className="border-border hover:bg-accent group flex flex-col gap-1 rounded-lg border p-4 text-right transition-colors sm:col-start-2"
				>
					<span className="text-muted-foreground inline-flex items-center justify-end gap-1 text-xs">
						Next
						<ChevronRight className="size-3" />
					</span>
					<span className="text-sm font-medium">{next.title}</span>
				</Link>
			)}
		</nav>
	);
}
