import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts", "**/*.test.tsx"],
		exclude: ["node_modules", "dist", "dashboard"],
	},
});
