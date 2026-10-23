import type { CompensationChangeResponse } from "@repo/shared";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@repo/ui/components/empty";
import { formatEmployeeMoney, formatEmployeeTimestamp } from "@/utils";

export function CompensationHistoryView({
	changes,
}: {
	changes: CompensationChangeResponse[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Compensation history</CardTitle>
			</CardHeader>
			<CardContent>
				{!changes.length ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No compensation history</EmptyTitle>
							<EmptyDescription>
								No compensation entries have been recorded.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<ol className="space-y-5">
						{changes.map((change) => (
							<li key={change.id} className="border-l-2 pl-4">
								<p className="font-medium">
									{change.oldBaseMinor === null
										? "Initial compensation"
										: "Compensation updated"}
								</p>
								<p className="text-sm text-muted-foreground">
									<time dateTime={change.changedAt}>
										{formatEmployeeTimestamp(change.changedAt)}
									</time>{" "}
									· Recorded in UTC
								</p>
								{change.oldBaseMinor !== null &&
									change.oldCurrencyCode !== null && (
										<p className="mt-1 break-words text-muted-foreground">
											Previous:{" "}
											{formatEmployeeMoney(
												change.oldBaseMinor,
												change.oldCurrencyCode,
											)}{" "}
											base · {(change.oldBonusBps ?? 0) / 100}% bonus target
										</p>
									)}
								<p className="mt-1 break-words">
									{formatEmployeeMoney(
										change.newBaseMinor,
										change.newCurrencyCode,
									)}{" "}
									base · {change.newBonusBps / 100}% bonus target
								</p>
							</li>
						))}
					</ol>
				)}
			</CardContent>
		</Card>
	);
}
