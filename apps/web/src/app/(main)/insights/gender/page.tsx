import { PageContainer } from "@repo/ui/general/PageContainer";
import { GenderPayPanel } from "@/components/insights/GenderPayPanel";
import { InsightsNav } from "@/components/insights/InsightsNav.view";

export default function GenderPage() {
	return (
		<PageContainer className="min-w-0 space-y-6">
			<h1 className="text-2xl font-semibold">Gender pay comparison</h1>
			<InsightsNav current="gender" />
			<GenderPayPanel />
		</PageContainer>
	);
}
