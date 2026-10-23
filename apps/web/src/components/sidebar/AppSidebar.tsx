"use client";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import { BookOpen, GalleryVerticalEnd, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@/constants";
import SidebarFooter from "./SidebarFooter";

export function AppSidebar() {
	const pathname = usePathname();

	const items = [
		{
			label: "Dashboard",
			link: "/",
			icon: Home,
			external: false,
		},
		{
			label: "Documentation",
			link: "/docs",
			icon: BookOpen,
			external: false,
		},
	];

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<GalleryVerticalEnd className="size-4" />
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-medium">{APP_NAME}</span>
								<span className="">heizen.work</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu className="gap-1">
						{items.map((item) => {
							const isActive =
								item.link === "/"
									? pathname === item.link
									: pathname === item.link ||
										pathname.startsWith(`${item.link}/`);

							return (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton
										render={
											<Link
												href={item.link}
												target={item.external ? "_blank" : undefined}
											>
												<item.icon className="size-4" />
												{item.label}
											</Link>
										}
										isActive={isActive}
									></SidebarMenuButton>
								</SidebarMenuItem>
							);
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
			<SidebarRail />
		</Sidebar>
	);
}
