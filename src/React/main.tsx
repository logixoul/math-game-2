import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./global.css";
import { QuickDebugLogger } from "../QuickDebugLogger";

const qdl = QuickDebugLogger.instance;

let wakeLock: WakeLockSentinel | null = null;

const requestWakeLock = async () => {
  if (!("wakeLock" in navigator)) {
    console.log("Wake Lock API not available in this browser/context.");
    return;
  }
  if (!window.isSecureContext) {
    console.log("Wake Lock API requires a secure context (HTTPS or localhost).");
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("Wake Lock is active!");
  } catch (err: any) {
    // Usually fails due to low battery or power-saving mode
    alert(`${err.name}, ${err.message}`);
    console.error(`${err.name}, ${err.message}`);
  }
};

const initWakeLock = () => {
  const onUserGesture = () => {
    requestWakeLock();
    window.removeEventListener("click", onUserGesture);
    window.removeEventListener("keydown", onUserGesture);
  };

  window.addEventListener("click", onUserGesture, { once: true });
  window.addEventListener("keydown", onUserGesture, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      requestWakeLock();
    }
  });
};

initWakeLock();

const container = document.getElementById("react-root");
if (!container) {
	throw new Error("Missing #react-root container");
}
createRoot(container).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
