import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

export default defineConfig({
	clearScreen: false,
	plugins: [reactRouter(), tailwindcss(), tsconfigPaths()],
	server: {
		host,
		port,
	},
});
