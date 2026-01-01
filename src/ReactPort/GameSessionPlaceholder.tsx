import { useParams } from "react-router-dom";

export function GameSessionPlaceholder() {
	const { gameTypeKey } = useParams<{ gameTypeKey: string }>();

	return (
		<div className="page">
			<header className="top-bar">
				<div className="logo">stefan play</div>
				<div className="login-status">Not logged in</div>
			</header>
			<main className="content">
				<h1>Game Session</h1>
				<p>Placeholder for the game session page.</p>
				<p>Game type: {gameTypeKey ?? "unknown"}</p>
			</main>
		</div>
	);
}
