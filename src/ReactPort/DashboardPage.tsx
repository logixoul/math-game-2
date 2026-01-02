import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppController } from "../AppController";
import { TopBar } from "./TopBar";
import styles from "./DashboardPage.module.css";
import { GameType } from "../GameTypes";

export function DashboardPage() {
	const navigate = useNavigate();
	const gameTypes = useMemo(() => AppController.getAvailableGameTypes(), []);

	const createSection = (title:string, gameTypesSingleCategory : GameType[]) =>
		<section className={styles.section}>
			<h3>{title}</h3>
			<ul className={styles.gameList}>
				{gameTypesSingleCategory.map((gameType) => (
					<li key={gameType.persistencyKey} className={styles.gameCard} onClick={() =>
								navigate(`/game/${encodeURIComponent(gameType.persistencyKey)}`)
							}>{gameType.localizedName}
					</li>
				))}
			</ul>
		</section>
	;

	return (
		<div className={"page"}>
			<TopBar />
			<main className={styles.content}>
				<h2>Привет!</h2>
				<p className={styles.subtitle}>Готов ли си?</p>
				{createSection("Свободна тренировка - 5кл.", gameTypes.fifthGrade)}
				{createSection("Свободна тренировка - 6кл.", gameTypes.sixthGrade)}
			</main>
		</div>
	);
}
