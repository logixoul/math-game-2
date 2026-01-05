import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";
import { useFirebaseSnapshot, firebaseController } from "../FirebaseController";
import { Popup } from "./Popup";

type TopBarProps = {
};

export function TopBar({  }: TopBarProps) {
	const firebaseState = useFirebaseSnapshot();
	const [isPopupOpen, setIsPopupOpen] = useState(false);

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
						<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} className={styles.authPopup}>
								<button className={styles.authOption} onClick={handleGoogleAuth}>с Google акаунт</button>
								<button className={styles.authOption} onClick={handleEmailPassword}>с имейл и парола</button>
						</Popup>
					</>
			}</div>
		</header>
	);
}
