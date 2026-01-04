export type WakeLockHandle = {
	dispose: () => void;
};

export const attachWakeLock = (): WakeLockHandle => {
	let isMounted = true;
	let wakeLock: WakeLockSentinel | null = null;

	const requestWakeLock = async () => {
		if (!("wakeLock" in navigator)){
			console.warn("failure1");
			return;
		}
		if (!window.isSecureContext) {
			console.warn("failure2");
			return;
		}
		try {
			const lock = await navigator.wakeLock.request("screen");
			console.log("WakeLock active!")
			
			if (!isMounted) {
				await lock.release();
				return;
			}
			wakeLock = lock;
		} catch {
			console.warn("failure3");
			// Ignore; wake lock can be denied (battery saver, no gesture, etc.)
		}
	};

	const onUserGesture = () => {
		requestWakeLock();
	};

	const onVisibilityChange = () => {
		if (document.visibilityState === "visible") {
			requestWakeLock();
		}
	};

	window.addEventListener("click", onUserGesture, { once: true });
	window.addEventListener("keydown", onUserGesture, { once: true });
	document.addEventListener("visibilitychange", onVisibilityChange);

	return {
		dispose: () => {
			isMounted = false;
			window.removeEventListener("click", onUserGesture);
			window.removeEventListener("keydown", onUserGesture);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			if (wakeLock) {
				wakeLock.release().catch(() => {});
				wakeLock = null;
			}
		},
	};
};
