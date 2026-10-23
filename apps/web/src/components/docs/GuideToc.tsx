"use client";

import { cn } from "@repo/ui/lib/utils";
import type { MarkdownHeading } from "@tanstack/markdown";
import { useEffect, useState } from "react";

function useActiveHeading(headings: MarkdownHeading[]) {
	const [activeId, setActiveId] = useState<string | undefined>(headings[0]?.id);

	useEffect(() => {
		const elements = headings
			.map((heading) => document.getElementById(heading.id))
			.filter((element): element is HTMLElement => element !== null);

		if (!elements.length) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible[0]) setActiveId(visible[0].target.id);
			},
			{ rootMargin: "-80px 0px -70% 0px", threshold: 0 },
		);

		for (const element of elements) observer.observe(element);
		return () => observer.disconnect();
	}, [headings]);

	return activeId;
}

export function GuideToc({ headings }: { headings: MarkdownHeading[] }) {
	const activeId = useActiveHeading(headings);

	if (!headings.length) return null;

	return (
		<nav aria-label="On this page" className="text-sm">
			<p className="text-foreground mb-3 font-medium">On this page</p>
			<ul className="border-border/70 space-y-2 border-l">
				{headings.map((heading) => (
					<li key={heading.id}>
						<a
							href={`#${heading.id}`}
							className={cn(
								"hover:text-foreground -ml-px block border-l py-0.5 transition-colors",
								heading.level > 2 ? "pl-6" : "pl-3",
								heading.id === activeId
									? "border-primary text-foreground"
									: "text-muted-foreground border-transparent",
							)}
						>
							{heading.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
