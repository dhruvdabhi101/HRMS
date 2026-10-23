import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "jsdom",
		globals: true,
		coverage: {
			provider: "v8",
			include: [
				"src/components/**/*.{ts,tsx}",
				"src/hooks/**/*.{ts,tsx}",
				"src/utils/**/*.{ts,tsx}",
			],
			exclude: ["**/*.d.ts", "**/__tests__/**", "**/*.test.*"],
		},
	},
});
