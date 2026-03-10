import { auth, firebaseController } from "@/logic/FirebaseController";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthUI } from "./AuthUI";
import styles from "./TopBar.module.css";

type TopBarProps = {};

export function TopBar(_: TopBarProps) {
	const topBarRef = useRef<HTMLElement | null>(null);
	const navigate = useNavigate();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(() => {
			setIsAdmin(firebaseController.isAdmin());
		});
		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const node = topBarRef.current;
		if (!node) return;

		const updateHeightVar = () => {
			const height = node.getBoundingClientRect().height;
			document.documentElement.style.setProperty(
				"--topbar-height",
				`${height}px`,
			);
		};

		updateHeightVar();

		const observer = new ResizeObserver(updateHeightVar);
		observer.observe(node);
		window.addEventListener("resize", updateHeightVar);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", updateHeightVar);
			document.documentElement.style.removeProperty("--topbar-height");
		};
	}, []);

	return (
		<header className={styles.topBar} ref={topBarRef}>
			<Link className={styles.homeLink} to="/">
				<img
					alt="Stefan Play Logo"
					className={styles.logoImage}
					src="../assets/play-logo.png"
					width="58"
					height="58"
				></img>
				<div className={styles.logo}>stefan play</div>
			</Link>
			{isAdmin && (
				<button
					type="button"
					onClick={() => navigate("/admin/assignments/")}
					className={styles.adminButton}
				>
					Edit assignments (admin)
				</button>
			)}
			<AuthUI />
		</header>
	);
}
