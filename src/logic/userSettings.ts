import { db } from "@/logic/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export const DEFAULT_GAME_SESSION_MAX_DURATION_MS = 10 * 60 * 1000;
export const DEBUG_GAME_SESSION_MAX_DURATION_MS = 2000;

export type UserSettings = {
	useDebugShortSessionDuration: boolean;
};

const defaultSettings: UserSettings = {
	useDebugShortSessionDuration: false,
};

export function useUserSettings(userUid: string | null | undefined): UserSettings {
	const [settings, setSettings] = useState<UserSettings>(defaultSettings);

	useEffect(() => {
		if (!userUid) {
			setSettings(defaultSettings);
			return;
		}

		const userRef = doc(db, "users", userUid);
		const unsubscribe = onSnapshot(
			userRef,
			(snapshot) => {
				const data = snapshot.data();
				setSettings({
					useDebugShortSessionDuration: Boolean(
						data?.userSettings?.useDebugShortSessionDuration,
					),
				});
			},
			() => {
				setSettings(defaultSettings);
			},
		);

		return () => unsubscribe();
	}, [userUid]);

	return settings;
}

export async function setUseDebugShortSessionDuration(
	userUid: string,
	enabled: boolean,
): Promise<void> {
	const userRef = doc(db, "users", userUid);
	await setDoc(
		userRef,
		{
			userSettings: {
				useDebugShortSessionDuration: enabled,
			},
		},
		{ merge: true },
	);
}

export function getGameSessionMaxDurationMs(settings: UserSettings): number {
	return settings.useDebugShortSessionDuration
		? DEBUG_GAME_SESSION_MAX_DURATION_MS
		: DEFAULT_GAME_SESSION_MAX_DURATION_MS;
}
