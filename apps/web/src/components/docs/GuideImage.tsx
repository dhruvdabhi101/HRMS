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
				aria-label={alt ? `Enlarge: ${alt}` : "Enlarge image"}
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
				<DialogContent className="flex max-h-[92dvh] w-[96vw] max-w-6xl flex-col gap-3 p-4 sm:max-w-6xl">
					<DialogTitle className="shrink-0 pr-8 text-sm font-medium">
						{alt ?? "Image"}
					</DialogTitle>
					<div className="min-h-0 overflow-auto">
						{/* biome-ignore lint/performance/noImgElement: guide images are authored as plain markdown */}
						<img
							src={src}
							alt={alt ?? ""}
							className="h-auto w-full rounded-lg border border-border"
						/>
					</div>
					<a
						href={src}
						target="_blank"
						rel="noopener noreferrer"
						className="w-fit shrink-0 text-sm text-primary underline underline-offset-4"
					>
						Open full-size image (new tab)
					</a>
				</DialogContent>
			</Dialog>
		</figure>
	);
}
