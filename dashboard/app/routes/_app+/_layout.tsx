import { useEffect, useState, useTransition } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { authClient } from "#dashboard/app/lib/auth.ts";

export default function AppLayout() {
	const navigate = useNavigate();

	const [isPending, startTransition] = useTransition();
	const [user, setUser] = useState<{ name: string; email: string } | null>(
		null,
	);

	useEffect(() => {
		authClient.getSession().then(({ data: session }) => {
			if (!session?.user) {
				navigate("/login");
			} else {
				startTransition(() => {
					setUser({
						name: session.user.name,
						email: session.user.email,
					});
				});
			}
		});
	}, [navigate]);

	const handleLogout = async () => {
		await authClient.signOut();
		navigate("/login");
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="border-b bg-white">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 justify-between">
						<div className="flex">
							<div className="flex shrink-0 items-center">
								<span className="text-xl font-bold">fullstack-starter</span>
							</div>

							<div className="ml-6 flex space-x-8">
								<Link
									to="/payments"
									className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
								>
									Payments
								</Link>
							</div>
						</div>

						<div className="flex items-center space-x-4">
							<span
								className={`text-sm text-gray-500 transition-opacity duration-300 ${isPending ? "opacity-0" : "opacity-100"}`}
							>
								{user?.email}
							</span>

							<button
								type="button"
								onClick={handleLogout}
								className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
							>
								Logout
							</button>
						</div>
					</div>
				</div>
			</nav>

			<main
				className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
			>
				<Outlet />
			</main>
		</div>
	);
}
