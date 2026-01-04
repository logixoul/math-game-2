import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./global.css";
import { QuickDebugLogger } from "../QuickDebugLogger";

const qdl = QuickDebugLogger.instance;

const container = document.getElementById("react-root");
if (!container) {
	throw new Error("Missing #react-root container");
}
createRoot(container).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
