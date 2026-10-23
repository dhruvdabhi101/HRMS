import type { Metadata } from "next";
import "@repo/ui/globals.css";
import { APP_NAME } from "@/constants";
import { dmSans } from "@/lib/fonts";
import Providers from "./providers";

export const metadata: Metadata = {
	title: APP_NAME,
	description: APP_NAME,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${dmSans.className} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
