import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		root: "./",
		setupFiles: ["./test/setup.ts"],
		include: ["test/**/*.spec.ts"],
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage",
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.spec.ts",
				"src/**/*.module.ts",
				"src/**/*.types.ts",
				"src/**/*.constants.ts",
				"src/**/*.dto.ts",
				"src/main.ts",
				"src/common/config.ts",
				"src/common/utils/**",
			],
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
		swc.vite({
			module: { type: "es6" },
		}),
	],
	esbuild: false,
	oxc: false,
});
