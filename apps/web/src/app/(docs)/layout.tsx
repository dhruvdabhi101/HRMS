import { SidebarProvider } from "@repo/ui/components/sidebar";
import { GuideSidebar } from "@/components/docs/GuideSidebar";
import { getGuideNav } from "@/lib/docs/source";
import "./guide.css";

export default async function GuideLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<SidebarProvider>
			<GuideSidebar nav={getGuideNav()} />
			{children}
		</SidebarProvider>
	);
}
