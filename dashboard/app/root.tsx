import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Toaster } from "sonner";
import type { Route } from "#dashboard/.react-router/types/app/+types/root.ts";
import { TRPCProvider } from "#dashboard/app/lib/trpc.tsx";

import "#dashboard/app/root.css";

export const links: Route.LinksFunction = () => [
	{
		rel: "icon",
		type: "image/png",
		href: "/icon.png",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Dashboard</title>
				<Meta />
				<Links />
			</head>

			<body className="min-h-screen bg-background antialiased">
				<TRPCProvider url="http://localhost:3001/trpc">{children}</TRPCProvider>
				<Toaster />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
