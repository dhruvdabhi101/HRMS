"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { ShieldXIcon } from "lucide-react";

interface AccessDeniedProps {
	requiredRoles?: string | string[];
}

export const AccessDenied = ({ requiredRoles }: AccessDeniedProps) => {
	const formatRoles = () => {
		if (!requiredRoles) return "proper permissions";

		const roles = Array.isArray(requiredRoles)
			? requiredRoles
			: [requiredRoles];

		if (roles.length === 1) {
			return `${roles[0]} role`;
		}

		if (roles.length === 2) {
			return `${roles[0]} or ${roles[1]} role`;
		}

		const lastRole = roles[roles.length - 1];
		const otherRoles = roles.slice(0, -1).join(", ");
		return `${otherRoles}, or ${lastRole} role`;
	};

	return (
		<div className="flex min-h-[60vh] items-center justify-center">
			<Card className="max-w-md">
				<CardHeader className="text-center">
					<div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
						<ShieldXIcon className="text-destructive h-6 w-6" />
					</div>
					<CardTitle>Access Denied</CardTitle>
					<CardDescription>
						You don&apos;t have permission to access this page. This page
						requires {formatRoles()}.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-muted-foreground text-center text-sm">
					Contact your organization owner if you believe this is a mistake.
				</CardContent>
			</Card>
		</div>
	);
};
