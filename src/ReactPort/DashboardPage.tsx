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
				<h1>Привет!</h1>
				<p className={styles.subtitle}>Готов ли си?</p>
				<section className={styles.section}>
					<h3>Свободна тренировка</h3>
					<ul className={styles.gameList}>
						{gameTypes.map((gameType) => (
							<li key={gameType.persistencyKey} className={styles.gameCard}>
								<div onClick={() =>
										navigate(`/game/${encodeURIComponent(gameType.persistencyKey)}`)
									} className={styles.gameName}>{gameType.localizedName}</div>
							</li>
						))}
					</ul>
				</section>
			</main>
		</div>
	);
}
