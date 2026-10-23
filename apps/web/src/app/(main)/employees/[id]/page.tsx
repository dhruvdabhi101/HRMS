import { PageContainer } from "@repo/ui/general/PageContainer";
import { EmployeeDetail } from "@/components/employees/EmployeeDetail";

export default async function EmployeePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<PageContainer>
			<EmployeeDetail employeeId={id} />
		</PageContainer>
	);
}
