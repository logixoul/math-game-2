import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { GameSessionPlaceholder } from "./GameSessionPlaceholder";

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<DashboardPage />} />
				<Route path="/game/:gameTypeKey" element={<GameSessionPlaceholder />} />
			</Routes>
		</BrowserRouter>
	);
}
