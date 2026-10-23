import { buttonVariants } from "@repo/ui/components/button";
import Link from "next/link";

export function InsightsNav({
	current,
}: {
	current: "groups" | "distribution" | "gender";
}) {
	const links = [
		{ id: "groups", href: "/insights", label: "Group by" },
		{
			id: "distribution",
			href: "/insights/distribution",
			label: "Distribution",
		},
		{ id: "gender", href: "/insights/gender", label: "Gender comparison" },
	];
	return (
		<nav aria-label="Pay insights" className="flex flex-wrap gap-2">
			{links.map((link) => (
				<Link
					key={link.id}
					href={link.href}
					aria-current={current === link.id ? "page" : undefined}
					className={buttonVariants({
						variant: current === link.id ? "secondary" : "outline",
					})}
				>
					{link.label}
				</Link>
			))}
		</nav>
	);
}
