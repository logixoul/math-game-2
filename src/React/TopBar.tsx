import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";
import { useFirebaseSnapshot, firebaseController } from "../FirebaseController";
import { Popup } from "./Popup";

type TopBarProps = {
};

export function TopBar({  }: TopBarProps) {
	const firebaseState = useFirebaseSnapshot();
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthBusy, setIsAuthBusy] = useState(false);

	useEffect(() => {
		if (!isPopupOpen) {
			setEmail("");
			setPassword("");
			setAuthError(null);
			setIsAuthBusy(false);
		}
	}, [isPopupOpen]);

	const handleGoogleAuth = async () => {
		setIsAuthBusy(true);
		setAuthError(null);
		try {
			await firebaseController.login();
			setIsPopupOpen(false);
		} catch (error: any) {
			setAuthError(error?.message ?? "Login failed");
		} finally {
			setIsAuthBusy(false);
		}
	};

	const handleEmailPassword = async (event: FormEvent) => {
		event.preventDefault();
		setIsAuthBusy(true);
		setAuthError(null);
		try {
			await firebaseController.loginWithEmailPassword(email, password);
			setIsPopupOpen(false);
		} catch (error: any) {
			setAuthError(error?.message ?? "Login failed");
		} finally {
			setIsAuthBusy(false);
		}
	};

	return (
		<header className={styles.topBar}>
			<Link className={styles.homeLink} to="/">
				<img className={styles.logoImage} src="../assets/play-logo.png" width="40" height="40"></img>
				<div className={styles.logo}>
					stefan play
				</div>
			</Link>
			<div className={styles.loginStatus}>{
				firebaseState.user ?
					<>
						Здравей, {firebaseState.user.displayName}!
						<button onClick={() => firebaseController.logout()}>Излез</button>
					</>
					:
					<>
						<div className={styles.authButtons}>
							<button
								className={styles.authTrigger}
								onClick={() => setIsPopupOpen((current) => !current)}
							>
								Влез
							</button>
						</div>
						<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} className={styles.authPopup}>
							<button className={styles.authOption} onClick={handleGoogleAuth} disabled={isAuthBusy}>
								с Google акаунт
							</button>
							<div className={styles.authDivider}>или</div>
							<form className={styles.authForm} onSubmit={handleEmailPassword}>
								<input
									className={styles.authInput}
									type="email"
									placeholder="Email"
									autoComplete="email"
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									disabled={isAuthBusy}
									required
								/>
								<input
									className={styles.authInput}
									type="password"
									placeholder="Password"
									autoComplete="current-password"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									disabled={isAuthBusy}
									required
								/>
								<button className={styles.authSubmit} type="submit" disabled={isAuthBusy}>
									с имейл и парола
								</button>
								{authError && <div className={styles.authError}>{authError}</div>}
							</form>
						</Popup>
					</>
			}</div>
		</header>
	);
}
