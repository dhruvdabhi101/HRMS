import { buttonVariants } from "@repo/ui/components/button";
import { PageContainer } from "@repo/ui/general/PageContainer";
import Link from "next/link";

export default function HomePage() {
	return (
		<PageContainer className="space-y-4">
			<h1 className="text-2xl font-semibold">Employee salary management</h1>
			<p className="text-muted-foreground">
				Add employees and keep a record of their starting compensation.
			</p>
			<Link href="/employees/new" className={buttonVariants()}>
				Add employee
			</Link>
		</PageContainer>
	);
}
