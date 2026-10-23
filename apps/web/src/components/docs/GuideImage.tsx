"use client";

import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { ZoomIn } from "lucide-react";
import { useState } from "react";

export function GuideImage({ src, alt }: { src: string; alt?: string }) {
	const [open, setOpen] = useState(false);

	return (
		<figure className="guide-figure">
			<button
				type="button"
				className="guide-figure-zoom"
				onClick={() => setOpen(true)}
				aria-label={alt ? `Enlarge: ${alt}` : "Enlarge screenshot"}
			>
				{/* biome-ignore lint/performance/noImgElement: guide images are authored as plain markdown */}
				<img src={src} alt={alt ?? ""} />
				<span className="guide-figure-hint" aria-hidden="true">
					<ZoomIn className="size-3.5" />
					Click to enlarge
				</span>
			</button>
			{alt && <figcaption>{alt}</figcaption>}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="w-auto max-w-[96vw] gap-3 p-3 sm:max-w-[96vw]">
					<DialogTitle className="pr-8 text-sm font-medium">
						{alt ?? "Screenshot"}
					</DialogTitle>
					{/* biome-ignore lint/performance/noImgElement: guide images are authored as plain markdown */}
					<img
						src={src}
						alt={alt ?? ""}
						className="max-h-[82vh] w-auto max-w-full rounded-lg border border-border object-contain"
					/>
				</DialogContent>
			</Dialog>
		</figure>
	);
}
