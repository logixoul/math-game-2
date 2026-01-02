import { Link } from "react-router-dom";
import styles from "./TopBar.module.css";

type TopBarProps = {
	statusText?: string;
};

export function TopBar({ statusText = "Not logged in" }: TopBarProps) {
	return (
		<header className={styles.topBar}>
			<Link className={styles.homeLink} to="/">
				<img className={styles.logoImage} src="../assets/play-logo.png" width="40" height="40"></img>
				<div className={styles.logo}>
					stefan play (v0.1)
				</div>
			</Link>
			<div className={styles.loginStatus}>{statusText}</div>
		</header>
	);
}
