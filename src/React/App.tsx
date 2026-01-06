import { HashRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { GameSessionRoute } from "./GameSessionPage";
import { ErrorPage } from "./ErrorPage";
import { PageLayout } from "./PageLayout";
import { AuthWall } from "./AuthWall";
import { AdminDashboardPage } from "./AdminDashboardPage";
import { UserAdminPage } from "./UserAdminPage";
import { UserAttempts } from "./UserAttempts";
import { AssignmentSessionRoute } from "./AssignmentSessionRoute";

export function App() {
	return (
		<HashRouter>
			{/* HashRouter avoids basename issues across root/subpath deployments. */}
			<Routes>
				<Route element={<PageLayout />}>
					<Route element={<AuthWall />}>
					<Route path="/" element={<DashboardPage />} />
					<Route path="/game/" element={<ErrorPage />} />
					<Route path="/game/:gameTypeKey" element={<GameSessionRoute />} />
					<Route path="/assignment/:assignmentId" element={<AssignmentSessionRoute />} />
					<Route path="/admin" element={<AdminDashboardPage />} />
					<Route path="/admin/users/:uid" element={<UserAdminPage />} />
					<Route path="/admin/users/:uid/attempts" element={<UserAttempts />} />
				</Route>
			</Route>
		</Routes>
		</HashRouter>
	);
}
