import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	reactCompiler: true,
	devIndicators: false,
	outputFileTracingIncludes: {
		"/docs/[[...slug]]": ["../../docs/**/*"],
	},
};

export default nextConfig;
