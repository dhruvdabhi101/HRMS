"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { type ReactElement, useEffect, useState } from "react";

export type TruncatedTextProps = {
	className?: string;
	/** Element to render the text in — defaults to a `span`. */
	render?: ReactElement;
	side?: "bottom" | "left" | "right" | "top";
	text: string;
	tooltipClassName?: string;
};

/**
 * Single-line text that only reveals a tooltip once the ellipsis actually
 * appears, so short values stay hover-free.
 */
export function TruncatedText({
	className,
	render = <span />,
	side = "top",
	text,
	tooltipClassName,
}: TruncatedTextProps) {
	const [element, setElement] = useState<HTMLElement | null>(null);
	const [isTruncated, setIsTruncated] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: new text can overflow inside an element whose box never resized, so the observer alone would miss it
	useEffect(() => {
		if (!element) return;

		const measure = () =>
			setIsTruncated(element.scrollWidth > element.clientWidth);

		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(element);

		return () => observer.disconnect();
	}, [element, text]);

	return (
		<Tooltip>
			<TooltipTrigger
				ref={setElement}
				render={render}
				className={cn("block truncate", className)}
			>
				{text}
			</TooltipTrigger>
			{isTruncated ? (
				<TooltipContent
					side={side}
					className={cn("max-w-96 wrap-break-word", tooltipClassName)}
				>
					{text}
				</TooltipContent>
			) : null}
		</Tooltip>
	);
}
