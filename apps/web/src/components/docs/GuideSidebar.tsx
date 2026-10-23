"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarRail,
} from "@repo/ui/components/sidebar";
import { ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/constants";
import type { GuideNavItem } from "@/lib/docs/source";

function GuideNavNode({
	item,
	pathname,
}: {
	item: GuideNavItem;
	pathname: string;
}) {
	const isActive = item.href === pathname;
	const [open, setOpen] = useState(true);

	if (!item.children.length) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					isActive={isActive}
					className="data-[active=true]:font-medium"
					render={<Link href={item.href}>{item.title}</Link>}
				/>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible open={open} onOpenChange={setOpen}>
				<div className="flex items-center gap-0.5">
					<SidebarMenuButton
						isActive={isActive}
						className="data-[active=true]:font-medium"
						render={
							item.hasPage ? (
								<Link href={item.href}>{item.title}</Link>
							) : (
								<span>{item.title}</span>
							)
						}
					/>
					<CollapsibleTrigger
						aria-label={`Toggle ${item.title}`}
						className="group/trigger text-sidebar-foreground/60 hover:text-sidebar-foreground flex size-6 shrink-0 items-center justify-center rounded-sm"
					>
						<ChevronRight className="size-3.5 transition-transform group-data-[panel-open]/trigger:rotate-90" />
					</CollapsibleTrigger>
				</div>
				<CollapsibleContent>
					<SidebarMenuSub className="gap-0.5">
						{item.children.map((child) => (
							<GuideNavNode key={child.href} item={child} pathname={pathname} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

export function GuideSidebar({ nav }: { nav: GuideNavItem[] }) {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={
								<Link href="/docs">
									<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center">
										<BookOpen className="size-4" />
									</div>
									<div className="flex flex-col gap-0.5 leading-none">
										<span className="text-xs font-semibold tracking-wide uppercase">
											{APP_NAME}
										</span>
										<span className="text-sidebar-foreground/60 text-[10px]">
											User guide
										</span>
									</div>
								</Link>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu className="gap-0.5">
						<SidebarMenuItem>
							<SidebarMenuButton
								isActive={pathname === "/docs"}
								render={<Link href="/docs">Overview</Link>}
							/>
						</SidebarMenuItem>
						{nav.map((item) => (
							<GuideNavNode key={item.href} item={item} pathname={pathname} />
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarGroup className="mt-auto">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<Link href="/">
									<ArrowLeft className="size-4" />
									Back to app
								</Link>
							}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
			<SidebarRail />
		</Sidebar>
	);
}
