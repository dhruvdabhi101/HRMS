import { PageContainer } from "@repo/ui/general/PageContainer";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

export default function NewEmployeePage() {
	return (
		<PageContainer className="space-y-6">
			<header>
				<h1 className="text-2xl font-semibold">Add employee</h1>
				<p className="mt-1 text-muted-foreground">
					Create an employee and record their starting compensation.
				</p>
			</header>
			<EmployeeForm />
		</PageContainer>
	);
}
