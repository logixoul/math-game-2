import {
	loginWithEmailPassword,
	loginWithGoogle,
	logout,
	sendPasswordReset,
	signupWithEmailPassword,
	useAuthUser,
} from "@/logic/auth";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuthUI.module.css";
import { Popup } from "./Popup";

type AuthUIProps = {};

export function AuthUI(_: AuthUIProps) {
	const user = useAuthUser();
	const navigate = useNavigate();
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
			await loginWithGoogle();
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
				await signupWithEmailPassword(email, password);
			} else {
				await loginWithEmailPassword(email, password);
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
			await sendPasswordReset(email);
			setAuthError("Password reset email sent.");
		} catch (error: any) {
			setAuthError(error?.message ?? "Password reset failed");
		} finally {
			setIsAuthBusy(false);
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
		} finally {
			navigate("/");
		}
	};

	return (
		<div className={styles.loginStatus}>
			{user ? (
				<button
					type="button"
					className="glassyButton"
					onClick={handleLogout}
				>
					Изход
				</button>
			) : (
				<>
					<div className={styles.authButtons}>
						<button
							type="button"
							className="glassyButton"
							onClick={() => setIsPopupOpen((current) => !current)}
						>
							Влез
						</button>
					</div>
					<Popup
						isOpen={isPopupOpen}
						onClose={() => setIsPopupOpen(false)}
						className={styles.authPopup}
					>
						<div className={styles.authTabs}>
							<button
								type="button"
								className={
									authMode === "login"
										? styles.authTabActive
										: styles.authTab
								}
								onClick={() => {
									setAuthMode("login");
									setAuthMethod(null);
									setAuthError(null);
								}}
							>
								Влез
							</button>
							<button
								type="button"
								className={
									authMode === "signup"
										? styles.authTabActive
										: styles.authTab
								}
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
								<button
									type="button"
									className={styles.authOption}
									onClick={handleGoogleAuth}
									disabled={isAuthBusy}
								>
									С Google акаунт
								</button>
								<button
									type="button"
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
									autoComplete={
										authMode === "signup"
											? "new-password"
											: "current-password"
									}
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
								<button
									className={styles.authSubmit}
									type="submit"
									disabled={isAuthBusy}
								>
									{authMode === "signup" ? "Регистрирай се" : "Влез"}
								</button>
								{authError && <div className={styles.authError}>{authError}</div>}
							</form>
						)}
					</Popup>
				</>
			)}
		</div>
	);
}