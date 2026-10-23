import { SidebarProvider } from "@repo/ui/components/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import SidebarInset from "@/components/sidebar/SidebarInset";

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
