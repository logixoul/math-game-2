import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";
import { useFirebaseSnapshot, firebaseController } from "../FirebaseController";

type TopBarProps = {
};

export function TopBar({  }: TopBarProps) {
	const firebaseState = useFirebaseSnapshot();

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
						<button onClick={() => firebaseController.login()}>Влез в системата</button>
					</>
			}</div>
		</header>
	);
}
