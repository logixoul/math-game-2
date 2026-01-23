import React from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import { QuickDebugLogger } from "../logic/QuickDebugLogger";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { PageLayout } from "./PageLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { AssignmentSessionRoute } from "@/pages/AssignmentSessionRoute";
import { AssignmentsAdminPage } from "@/pages/AssignmentsAdminPage";
import { initGlobalFormattingSettings } from "@/logic/Formatting";

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
