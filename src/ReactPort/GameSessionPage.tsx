import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GameType } from "../GameTypes";
import { FirebaseController } from "../FirebaseController";
import { GameSession, GameSessionUI } from "../GameSession";
import * as util from "../util";
import { AppController } from "../AppController";

type GameSessionPageProps = {
	gameType: GameType | null;
	decodedKey: string | null;
};

type Message = {
	text: string;
	color: string;
	isBold?: boolean;
	isPrompt?: boolean;
	answer?: string;
};

type ProgressSnapshot = {
	pointsTowardWin: number;
	problemsAttempted: number;
	pointsRequiredToWin: number;
	minProblemsAttemptedToWin: number;
};

export function GameSessionRoute() {
	const { gameTypeKey } = useParams<{ gameTypeKey: string }>();
	const decodedKey = gameTypeKey ? decodeURIComponent(gameTypeKey) : null;
	const gameType = useMemo(() => {
		if (!decodedKey) return null;
		return AppController.getAvailableGameTypes().find(
			(type) => type.persistencyKey === decodedKey
		);
	}, [decodedKey]);

	return <GameSessionPage gameType={gameType} decodedKey={decodedKey} />;
}

export function GameSessionPage({
	gameType,
	decodedKey,
}: GameSessionPageProps) {
	const sessionRef = useRef<GameSession | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
	const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
	const [hasWon, setHasWon] = useState(false);
	const [currentAnswer, setCurrentAnswer] = useState("");
	const [desktopInput, setDesktopInput] = useState("");
	const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
	const isMobile = useMemo(() => util.isMobileDevice(), []);
	const ui = useMemo<GameSessionUI>(() => {
		return {
			informUser: (message, color, isBold) => {
				setMessages((prev) => [...prev, { text: message, color, isBold }]);
			},
			updateProgressIndicator: () => {
				const session = sessionRef.current;
				if (!session) return;
				setProgress({
					pointsTowardWin: session.pointsTowardWin,
					problemsAttempted: session.problemsAttempted,
					pointsRequiredToWin: session.pointsRequiredToWin,
					minProblemsAttemptedToWin: session.minProblemsAttemptedToWin,
				});
			},
			updateSessionTimeIndicator: () => {
				const session = sessionRef.current;
				if (!session) return;
				const msLeft =
					session.maxSessionDurationMs -
					(Date.now() - session.gameStartTimestamp);
				setMinutesLeft(Math.max(0, Math.floor(msLeft / 60000)));
			},
			showPrompt: () => {
				const session = sessionRef.current;
				if (!session) return;
				const prompt = session.getCurrentPrompt();
				if (!prompt) return;
				setMessages((prev) => {
					const nextIndex = prev.length;
					setActivePromptIndex(nextIndex);
					return [
						...prev,
						{ text: `${prompt.text} = `, color: "black", isPrompt: true },
					];
				});
				setCurrentAnswer("");
				setDesktopInput("");
			},
			onWin: () => {
				setHasWon(true);
			},
		};
	}, []);

	useEffect(() => {
		setMessages([]);
		setProgress(null);
		setMinutesLeft(null);
		setHasWon(false);
		setCurrentAnswer("");
		setDesktopInput("");
		setActivePromptIndex(null);

		if (!gameType) {
			sessionRef.current = null;
			return;
		}

		const firebaseController = new FirebaseController();
		void firebaseController.init();
		const appContext = { firebaseController };
		const session = new GameSession(appContext, ui, gameType);
		sessionRef.current = session;
		ui.updateProgressIndicator();
		ui.updateSessionTimeIndicator();
		ui.showPrompt();

		return () => {
			sessionRef.current = null;
		};
	}, [gameType, ui]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			if (!sessionRef.current || hasWon) return;
			ui.updateSessionTimeIndicator();
		}, 1000);
		return () => {
			window.clearInterval(intervalId);
		};
	}, [hasWon, ui]);

	useEffect(() => {
		const log = logRef.current;
		if (!log) return;
		log.scrollTop = log.scrollHeight;
	}, [messages, currentAnswer]);

	const submitAnswer = (text: string) => {
		if (!sessionRef.current) return;
		const trimmed = text.trim();
		if (!trimmed) return;
		setMessages((prev) => {
			if (activePromptIndex === null) return prev;
			return prev.map((message, index) =>
				index === activePromptIndex
					? { ...message, answer: trimmed }
					: message
			);
		});
		setCurrentAnswer("");
		setDesktopInput("");
		const numeric = Number.parseInt(trimmed, 10);
		if (Number.isNaN(numeric)) return;
		sessionRef.current.onUserAnswered(numeric);
	};

	const handleDesktopSubmit = () => {
		submitAnswer(desktopInput);
	};

	const handleKeypadOk = () => {
		submitAnswer(currentAnswer);
	};

	const handleKeypadAppend = (value: string) => {
		setCurrentAnswer((prev) => prev + value);
	};

	const handleKeypadBackspace = () => {
		setCurrentAnswer((prev) => prev.slice(0, -1));
	};

	const handleReveal = () => {
		sessionRef.current?.onUserRequestedAnswerReveal();
	};

	return (
		<div className="page">
			<header className="top-bar">
				<div className="logo">stefan play</div>
				<div className="login-status">Not logged in</div>
			</header>
			<main className="content">
				<h1>Game Session</h1>
				{decodedKey && !gameType && (
					<p>Game type not found for key: {decodedKey}</p>
				)}
				{!decodedKey && <p>Missing game type key.</p>}
				{gameType && (
					<>
						<p>Game type: {gameType.localizedName}</p>
						{progress && (
							<p>
								Points {progress.pointsTowardWin}/
								{progress.pointsRequiredToWin}, Problems{" "}
								{progress.problemsAttempted}/
								{progress.minProblemsAttemptedToWin}
							</p>
						)}
						{minutesLeft !== null && <p>Minutes left: {minutesLeft}</p>}
						{hasWon && <p>Session complete.</p>}
						<div className="message-log" ref={logRef}>
							{messages.map((message, index) => (
								<p
									key={`${index}-${message.text}`}
									style={{
										color: message.color,
										fontWeight: message.isBold ? "bold" : "normal",
									}}
								>
									{message.text}
									{message.isPrompt && (
										<span className="answer-inline">
											{message.answer ??
												(index === activePromptIndex ? currentAnswer : "")}
										</span>
									)}
								</p>
							))}
						</div>
						<div className="input-area">
							{isMobile ? (
								<div className="keypad">
									{["1", "2", "3", "4", "5", "6", "7", "8", "9", "-", "0"].map(
										(label) => (
											<button
												key={label}
												type="button"
												className="keypad-button"
												onClick={() => handleKeypadAppend(label)}
											>
												{label}
											</button>
										)
									)}
									<button
										type="button"
										className="keypad-button keypad-button-secondary"
										onClick={handleKeypadBackspace}
									>
										Back
									</button>
									<button
										type="button"
										className="keypad-button keypad-button-ok"
										onClick={handleKeypadOk}
									>
										OK
									</button>
								</div>
							) : (
								<div className="desktop-input">
									<input
										type="text"
										value={desktopInput}
										onChange={(event) => setDesktopInput(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter") {
												handleDesktopSubmit();
											}
										}}
										placeholder="Type answer and press Enter"
									/>
									<button
										type="button"
										className="start-button"
										onClick={handleDesktopSubmit}
									>
										Submit
									</button>
								</div>
							)}
							<button
								type="button"
								className="reveal-button"
								onClick={handleReveal}
							>
								I don't know
							</button>
						</div>
					</>
				)}
			</main>
		</div>
	);
}
