import { redirect } from "react-router";

export function clientLoader() {
	return redirect("/payments");
}

export default function AppIndex() {
	return null;
}
