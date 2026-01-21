import { HashRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { GameSessionRoute } from "@/pages/GameSessionPage";
import { ErrorPage } from "@/pages/ErrorPage";
import { PageLayout } from "@/React/PageLayout";
import { AuthWall } from "@/pages/AuthWall";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { UserAdminPage } from "@/pages/UserAdminPage";
import { UserAttempts } from "@/pages/UserAttempts";
import { AssignmentSessionRoute } from "@/pages/AssignmentSessionRoute";

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
