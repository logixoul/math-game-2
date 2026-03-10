import { initGlobalFormattingSettings } from "@/logic/Formatting";
import { AdminPage } from "@/pages/AdminPage";
import { AssignmentSessionRoute } from "@/pages/AssignmentSessionRoute";
import { AssignmentsAdminPage } from "@/pages/AssignmentsAdminPage";
import { DashboardPage } from "@/pages/DashboardPage";
import React from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { QuickDebugLogger } from "../logic/QuickDebugLogger";
import { PageLayout } from "./PageLayout";
import "./global.css";

const qdl = QuickDebugLogger.instance;
qdl.beginListeningForErrors();

initGlobalFormattingSettings();

const container = document.getElementById("react-root");
if (!container) {
	throw new Error("Missing #react-root container");
}

const router = createHashRouter([
	{
		element: <PageLayout />,
		children: [
			{ path: "/", element: <DashboardPage /> },
			{ path: "/assignment/:assignmentId", element: <AssignmentSessionRoute /> },
			{ path: "/admin/", element: <AdminPage /> },
			{ path: "/admin/assignments/", element: <AssignmentsAdminPage /> },
		]
	}
]);

createRoot(container).render(
	<React.StrictMode>
		<RouterProvider
			router={router}
			future={{ v7_startTransition: true }}
		/>
	</React.StrictMode>
);
