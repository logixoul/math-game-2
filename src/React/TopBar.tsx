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
	const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
	const [authMethod, setAuthMethod] = useState<"google" | "email" | null>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [authError, setAuthError] = useState<string | null>(null);
	const [isAuthBusy, setIsAuthBusy] = useState(false);

	useEffect(() => {
		if (!isPopupOpen) {
			setAuthMode(null);
			setAuthMethod(null);
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
			if (authMode === "signup") {
				await firebaseController.signupWithEmailPassword(email, password);
			} else {
				await firebaseController.loginWithEmailPassword(email, password);
			}
			setIsPopupOpen(false);
		} catch (error: any) {
			setAuthError(error?.message ?? "Login failed");
		} finally {
			setIsAuthBusy(false);
		}
	};

	const handleResetPassword = async () => {
		if (!email) {
			setAuthError("Enter your email to reset the password.");
			return;
		}
		setIsAuthBusy(true);
		setAuthError(null);
		try {
			await firebaseController.sendPasswordReset(email);
			setAuthError("Password reset email sent.");
		} catch (error: any) {
			setAuthError(error?.message ?? "Password reset failed");
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
					<button className={styles.logoutButton} onClick={() => firebaseController.logout()}>Изход</button>
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
							<div className={styles.authTabs}>
								<button
									className={authMode === "login" ? styles.authTabActive : styles.authTab}
									onClick={() => {
										setAuthMode("login");
										setAuthMethod(null);
										setAuthError(null);
									}}
								>
									Влез
								</button>
								<button
									className={authMode === "signup" ? styles.authTabActive : styles.authTab}
									onClick={() => {
										setAuthMode("signup");
										setAuthMethod(null);
										setAuthError(null);
									}}
								>
									Регистрирай се
								</button>
							</div>
							{authMode && (
								<div className={styles.authOptions}>
									<button className={styles.authOption} onClick={handleGoogleAuth} disabled={isAuthBusy}>
										С Google акаунт
									</button>
									<button
										className={styles.authOption}
										onClick={() => {
											setAuthMethod("email");
											setAuthError(null);
										}}
										disabled={isAuthBusy}
									>
										С имейл
									</button>
								</div>
							)}
							{authMode && authMethod === "email" && (
								<form className={styles.authForm} onSubmit={handleEmailPassword}>
									<input
										className={styles.authInput}
										type="email"
										placeholder="Имейл"
										autoComplete="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										disabled={isAuthBusy}
										required
									/>
									<input
										className={styles.authInput}
										type="password"
										placeholder="Парола"
										autoComplete={authMode === "signup" ? "new-password" : "current-password"}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										disabled={isAuthBusy}
										required
									/>
									<button
										type="button"
										className={styles.authLink}
										onClick={handleResetPassword}
										disabled={isAuthBusy}
									>
										Забравена парола?
									</button>
									<button className={styles.authSubmit} type="submit" disabled={isAuthBusy}>
										{authMode === "signup" ? "Регистрирай се" : "Влез"}
									</button>
									{authError && <div className={styles.authError}>{authError}</div>}
								</form>
							)}
						</Popup>
					</>
			}</div>
		</header>
	);
}

