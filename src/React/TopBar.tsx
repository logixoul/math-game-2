import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";
import { useFirebaseSnapshot, firebaseController } from "../FirebaseController";

type TopBarProps = {
};

export function TopBar({  }: TopBarProps) {
	const firebaseState = useFirebaseSnapshot();
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const popupRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!isPopupOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (popupRef.current && target && !popupRef.current.contains(target)) {
				setIsPopupOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsPopupOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isPopupOpen]);

	const handleGoogleAuth = async () => {
		await firebaseController.login();
		setIsPopupOpen(false);
	};

	const handleEmailPassword = () => {
		alert("Email/password login is not implemented yet.");
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
								Account
							</button>
						</div>
						{isPopupOpen && (
							<div className={styles.authPopup} ref={popupRef}>
								<button className={styles.authOption} onClick={handleGoogleAuth}>с Google акаунт</button>
								<button className={styles.authOption} onClick={handleEmailPassword}>с имейл и парола</button>
							</div>
						)}
					</>
			}</div>
		</header>
	);
}
