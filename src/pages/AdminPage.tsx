import {
    isAdminUser,
    useAuthUser,
} from "@/logic/auth";
import {
    setUseDebugShortSessionDuration,
    useUserSettings,
} from "@/logic/userSettings";
import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./AdminPage.module.css";

export function AdminPage() {
	const user = useAuthUser();
	const userSettings = useUserSettings(user?.uid);
	const [isSaving, setIsSaving] = useState(false);

	if (!isAdminUser(user)) {
		return <div className="scrollablePage">Тази страница е само за администратори.</div>;
	}

	const handleToggle = async (checked: boolean) => {
		if (!user) return;
		setIsSaving(true);
		try {
			await setUseDebugShortSessionDuration(user.uid, checked);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="scrollablePage">
			<div className={styles.container}>
				<h2>Admin</h2>
				<div className={styles.card}>
					<Link to="/admin/assignments/" className={styles.linkButton}>
						Edit assignments
					</Link>
				</div>
				<div className={styles.card}>
					<label className={styles.checkboxRow}>
						<input
							type="checkbox"
							checked={userSettings.useDebugShortSessionDuration}
							onChange={(event) => handleToggle(event.target.checked)}
							disabled={isSaving}
						/>
						<span>
							Debug short game session timeout (2s instead of 10min)
						</span>
					</label>
				</div>
			</div>
		</div>
	);
}
