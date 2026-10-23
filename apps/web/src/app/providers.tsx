"use client";

import { Toaster } from "@repo/ui/components/sonner";
import { ThemeProvider } from "@repo/ui/components/theme-provider";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import {
	type BreadcrumbLabels,
	BreadcrumbProvider,
} from "@/contexts/breadcrumb-context";
import { ReactQueryClientProvider } from "@/lib/tanstack-query";

/**
 * Static route labels for the breadcrumb.
 * Add an entry here whenever you add a new named route to the app.
 * Dynamic segments (IDs, slugs) are registered per-page via `useBreadcrumbLabel`.
 */
const BREADCRUMB_LABELS: BreadcrumbLabels = {
	employees: "Employees",
	new: "Add employee",
	settings: "Settings",
	users: "Users",
	dashboard: "Dashboard",
};

const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			disableTransitionOnChange
		>
			<ReactQueryClientProvider>
				<BreadcrumbProvider defaults={BREADCRUMB_LABELS}>
					<Toaster
						duration={2500}
						richColors
						closeButton
						position="top-right"
					/>
					<TooltipProvider>{children}</TooltipProvider>
				</BreadcrumbProvider>
			</ReactQueryClientProvider>
		</ThemeProvider>
	);
};

export default Providers;
