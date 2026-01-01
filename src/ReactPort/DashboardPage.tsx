import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppController } from "../AppController";
import { TopBar } from "./TopBar";

export function DashboardPage() {
	const navigate = useNavigate();
	const gameTypes = useMemo(() => AppController.getAvailableGameTypes(), []);

	return (
		<div className="page">
			<TopBar />
			<main className="content">
				<h1>Dashboard</h1>
				<ul className="game-list">
					{gameTypes.map((gameType) => (
						<li key={gameType.persistencyKey} className="game-card">
							<div className="game-name">{gameType.localizedName}</div>
							<button
								type="button"
								className="start-button"
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
