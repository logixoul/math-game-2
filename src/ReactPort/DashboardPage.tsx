import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppController } from "../AppController";
import { TopBar } from "./TopBar";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
	const navigate = useNavigate();
	const gameTypes = useMemo(() => AppController.getAvailableGameTypes(), []);

	return (
		<div className={"page"}>
			<TopBar />
			<main className={styles.content}>
				<h2>Привет!</h2>
				<p className={styles.subtitle}>Готов ли си?</p>
				<section className={styles.section}>
					<h3>Свободна тренировка</h3>
					<ul className={styles.gameList}>
						{gameTypes.map((gameType) => (
							<li key={gameType.persistencyKey} className={styles.gameCard} onClick={() =>
										navigate(`/game/${encodeURIComponent(gameType.persistencyKey)}`)
									}>{gameType.localizedName}
							</li>
						))}
					</ul>
				</section>
			</main>
		</div>
	);
}
