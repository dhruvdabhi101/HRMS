"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import { SidebarInset, SidebarTrigger } from "@repo/ui/components/sidebar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { LoadingScreen } from "@repo/ui/general/LoadingScreen";
import { PageContainer } from "@repo/ui/general/PageContainer";
import Link from "next/link";
import { Fragment } from "react";
import { APP_NAME } from "@/constants";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const SidebarRight = ({ children }: { children: React.ReactNode }) => {
	const isPending = false;
	const crumbs = useBreadcrumbs(APP_NAME);

	return (
		<SidebarInset>
			<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/75 backdrop-blur-xl backdrop-saturate-150 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 reduced-transparency:bg-background reduced-transparency:backdrop-blur-none">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 my-auto data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							{crumbs.map((crumb, index) => (
								<Fragment key={crumb.href}>
									{index > 0 && (
										<BreadcrumbSeparator className="hidden md:block" />
									)}
									<BreadcrumbItem
										className={index === 0 ? "hidden md:block" : ""}
									>
										{crumb.isLoading ? (
											<Skeleton className="h-4 w-24 rounded" />
										) : crumb.isLast ? (
											<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink
												render={<Link href={crumb.href}>{crumb.label}</Link>}
												href={crumb.href}
											>
												{crumb.label}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								</Fragment>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<div className="flex flex-1 flex-col">
				{isPending ? (
					<PageContainer>
						<LoadingScreen />
					</PageContainer>
				) : (
					children
				)}
			</div>
		</SidebarInset>
	);
};

export default SidebarRight;
