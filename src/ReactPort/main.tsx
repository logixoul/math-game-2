import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const container = document.getElementById("react-root");
if (!container) {
	throw new Error("Missing #react-root container");
}

createRoot(container).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
