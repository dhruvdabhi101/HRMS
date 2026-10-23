import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	SidebarFooter as CnSidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

const SidebarFooter = () => {
	const { theme, setTheme } = useTheme();
	const currentTheme =
		THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[0];

	return (
		<CnSidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
									<currentTheme.icon className="size-4" />
									<span>Theme</span>
									<span className="text-muted-foreground ml-auto text-xs">
										{currentTheme.label}
									</span>
								</SidebarMenuButton>
							}
						></DropdownMenuTrigger>
						<DropdownMenuContent align="end" side="top" className="w-[200px]">
							{THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
								<DropdownMenuItem
									key={value}
									onClick={() => setTheme(value)}
									className="cursor-pointer"
								>
									<Icon className="h-4 w-4" />
									<span>{label}</span>
									{theme === value && (
										<div className="bg-primary ml-auto h-2 w-2 rounded-full" />
									)}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</CnSidebarFooter>
	);
};

export default SidebarFooter;
