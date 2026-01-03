import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { GameSessionRoute } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/game/" element={<ErrorPage />} />
				<Route path="/game/:gameTypeKey" element={<GameSessionRoute />} />
			</Routes>
		</BrowserRouter>
	);
}
