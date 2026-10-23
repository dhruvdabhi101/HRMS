"use client";

import { Button } from "@repo/ui/components/button";
import {
	NativeSelect,
	NativeSelectOption,
} from "@repo/ui/components/native-select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";

export interface PaginationData {
	currentPage: number;
	pageCount: number;
	goToPage: (page: number) => void;
	limit: number;
	setLimit: (limit: number) => void;
}

const PaginationControls = ({
	currentPage,
	pageCount,
	goToPage,
	limit,
	setLimit,
}: PaginationData) => {
	const pageSizeId = useId();
	const getVisiblePages = () => {
		if (pageCount <= 7) {
			return Array.from({ length: pageCount }, (_, index) => index + 1);
		}

		const pages: (number | "ellipsis")[] = [];

		pages.push(1);

		const delta = 2;
		const rangeStart = Math.max(2, currentPage - delta);
		const rangeEnd = Math.min(pageCount - 1, currentPage + delta);

		if (rangeStart > 2) {
			pages.push("ellipsis");
		}

		for (let i = rangeStart; i <= rangeEnd; i++) {
			if (i !== 1 && i !== pageCount) {
				pages.push(i);
			}
		}

		if (rangeEnd < pageCount - 1) {
			pages.push("ellipsis");
		}

		if (pageCount > 1) {
			pages.push(pageCount);
		}

		return pages;
	};

	return (
		<nav
			aria-label="Table pagination"
			className="mt-4 flex flex-wrap items-center justify-between gap-4"
		>
			<div className="flex flex-wrap items-center gap-1">
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Previous page"
					disabled={currentPage <= 1}
					onClick={() => goToPage(currentPage - 1)}
				>
					<ChevronLeft />
				</Button>
				{getVisiblePages().map((page, index) =>
					page === "ellipsis" ? (
						<span key={`ellipsis-${index}`} className="px-1" aria-hidden="true">
							…
						</span>
					) : (
						<Button
							key={page}
							variant={page === currentPage ? "secondary" : "ghost"}
							size="sm"
							aria-label={`Page ${page}`}
							aria-current={page === currentPage ? "page" : undefined}
							onClick={() => goToPage(page)}
						>
							{page}
						</Button>
					),
				)}
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Next page"
					disabled={currentPage >= pageCount}
					onClick={() => goToPage(currentPage + 1)}
				>
					<ChevronRight />
				</Button>
			</div>
			<label
				htmlFor={pageSizeId}
				className="text-muted-foreground flex items-center gap-3 text-sm"
			>
				Rows per page
				<NativeSelect
					id={pageSizeId}
					value={String(limit)}
					onChange={(event) => setLimit(Number(event.target.value))}
				>
					{[...new Set([25, 50, 100, limit])]
						.sort((a, b) => a - b)
						.map((size) => (
							<NativeSelectOption key={size} value={size}>
								{size}
							</NativeSelectOption>
						))}
				</NativeSelect>
			</label>
		</nav>
	);
};

export default PaginationControls;
