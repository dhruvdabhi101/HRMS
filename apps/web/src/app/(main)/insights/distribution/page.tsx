import { PageContainer } from "@repo/ui/general/PageContainer";
import { InsightsNav } from "@/components/insights/InsightsNav.view";
import { PayDistributionPanel } from "@/components/insights/PayDistributionPanel";

export default function DistributionPage() {
	return (
		<PageContainer className="min-w-0 space-y-6">
			<h1 className="text-2xl font-semibold">Pay distribution</h1>
			<InsightsNav current="distribution" />
			<PayDistributionPanel />
		</PageContainer>
	);
}
