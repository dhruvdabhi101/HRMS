"use client";

import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";

interface ColorBadgeProps {
	text: string;
	className?: string;
}

const getColorVariant = (text: string) => {
	const normalizedText = text.toLowerCase().trim();

	switch (normalizedText) {
		case "owner":
			return {
				className:
					"bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
				label: "Owner",
			};
		case "admin":
			return {
				className:
					"bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
				label: "Admin",
			};
		case "member":
			return {
				className: "bg-muted text-muted-foreground border-border",
				label: "Member",
			};
		default:
			return {
				className: "bg-muted text-muted-foreground border-border",
				label: text.charAt(0).toUpperCase() + text.slice(1),
			};
	}
};

export const ColorBadge = ({ text, className }: ColorBadgeProps) => {
	const { className: variantClass, label } = getColorVariant(text);

	return (
		<Badge variant="outline" className={cn(variantClass, className)}>
			{label}
		</Badge>
	);
};
