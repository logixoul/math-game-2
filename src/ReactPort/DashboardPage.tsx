import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppController } from "../AppController";
import { TopBar } from "./TopBar";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
	const navigate = useNavigate();
	const gameTypes = useMemo(() => AppController.getAvailableGameTypes(), []);

	return (
		<div className={styles.page + " page"}>
			<TopBar />
			<main className={styles.content}>
				<h1>Dashboard</h1>
				<ul className={styles.gameList}>
					{gameTypes.map((gameType) => (
						<li key={gameType.persistencyKey} className={styles.gameCard}>
							<div className={styles.gameName}>{gameType.localizedName}</div>
							<button
								type="button"
								className={styles.startButton}
								onClick={() =>
									navigate(`/game/${encodeURIComponent(gameType.persistencyKey)}`)
								}
							>
								Start game
							</button>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
}
