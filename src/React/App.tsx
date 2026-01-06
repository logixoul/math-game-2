import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { GameSessionRoute } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";
import { PageLayout } from "./PageLayout";
import { AuthWall } from "./AuthWall";

export function App() {
	const basePath = new URL(document.baseURI).pathname;
	const routerBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
	return (
		<BrowserRouter basename={routerBase}>
			<Routes>
				<Route element={<PageLayout />}>
					<Route element={<AuthWall />}>
						<Route path="/" element={<DashboardPage />} />
						<Route path="/game/" element={<ErrorPage />} />
						<Route path="/game/:gameTypeKey" element={<GameSessionRoute />} />
					</Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
