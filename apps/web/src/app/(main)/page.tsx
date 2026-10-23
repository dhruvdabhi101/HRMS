import { LoadingScreen } from "@repo/ui/general/LoadingScreen";
import { Suspense } from "react";
import { EmployeeDirectory } from "@/components/employees/EmployeeDirectory";

export default function HomePage() {
	return (
		<Suspense fallback={<LoadingScreen />}>
			<EmployeeDirectory />
		</Suspense>
	);
}
