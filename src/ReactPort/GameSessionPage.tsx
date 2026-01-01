import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GameType } from "../GameTypes";
import { FirebaseController } from "../FirebaseController";
import { GameSession, GameSessionUI } from "../GameSession";
import * as util from "../util";
import { AppController } from "../AppController";
import { GameInputArea } from "./GameInputArea";
import { TopBar } from "./TopBar";

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
	const [sessionComplete, setSessionComplete] = useState(false);
	const [currentAnswer, setCurrentAnswer] = useState("");
	const [desktopInput, setDesktopInput] = useState("");
	const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
	const isMobile = useMemo(() => util.isMobileDevice(), []);
	const timedOutRef = useRef(false);
	const desktopInputRef = useRef<HTMLInputElement | null>(null);
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
			onWin: (resultStats) => {
				setHasWon(true);
				setSessionComplete(true);
				const minutes = Math.floor(resultStats.timeElapsedMs / 60000);
				const seconds = Math.floor(resultStats.timeElapsedMs / 1000) % 60;
				setMessages((prev) => [
					...prev,
					{ text: "You win!", color: "green", isBold: true },
					{
						text: `Time: ${minutes}m ${seconds}s. Accuracy: ${resultStats.percentCorrectOnFirstTry}%.`,
						color: "black",
					},
				]);
			},
		};
	}, []);

	const startNewSession = (nextGameType: GameType) => {
		setMessages([]);
		setProgress(null);
		setMinutesLeft(null);
		setHasWon(false);
		setSessionComplete(false);
		setCurrentAnswer("");
		setDesktopInput("");
		setActivePromptIndex(null);
		timedOutRef.current = false;

		const firebaseController = new FirebaseController();
		void firebaseController.init();
		const appContext = { firebaseController };
		const session = new GameSession(appContext, ui, nextGameType);
		sessionRef.current = session;
		ui.updateProgressIndicator();
		ui.updateSessionTimeIndicator();
		ui.showPrompt();
	};

	useEffect(() => {
		if (!gameType) {
			sessionRef.current = null;
			return;
		}
		startNewSession(gameType);

		return () => {
			sessionRef.current = null;
		};
	}, [gameType, ui]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			const session = sessionRef.current;
			if (!session || sessionComplete) return;
			ui.updateSessionTimeIndicator();
			const msLeft =
				session.maxSessionDurationMs -
				(Date.now() - session.gameStartTimestamp);
			if (msLeft <= 0 && !timedOutRef.current) {
				timedOutRef.current = true;
				setSessionComplete(true);
				const stats = session.getResultStats();
				setMessages((prev) => [
					...prev,
					{ text: "Time is up.", color: "red", isBold: true },
					{
						text: `Game type: ${stats.gameType.localizedName}.`,
						color: "black",
					},
					{
						text: `Points: ${stats.pointsTowardWin}.`,
						color: "black",
					},
					{
						text: `Max points reached: ${stats.maxReachedPointsTowardWin}.`,
						color: "black",
					},
					{
						text: `Problems attempted: ${stats.problemsAttempted}.`,
						color: "black",
					},
					{
						text: `Accuracy: ${stats.percentCorrectOnFirstTry}%.`,
						color: "black",
					},
				]);
			}
		}, 1000);
		return () => {
			window.clearInterval(intervalId);
		};
	}, [sessionComplete, ui]);

	useEffect(() => {
		const log = logRef.current;
		if (!log) return;
		log.scrollTop = log.scrollHeight;
	}, [messages, currentAnswer]);

	useEffect(() => {
		if (isMobile || sessionComplete) return;
		desktopInputRef.current?.focus();
	}, [activePromptIndex, isMobile, sessionComplete]);

	const submitAnswer = (text: string) => {
		if (!sessionRef.current || sessionComplete) return;
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
		if (sessionComplete) return;
		sessionRef.current?.onUserRequestedAnswerReveal();
	};

	return (
		<div className="page">
			<TopBar />
			<main className="content">
				<h1>Game Session</h1>
				{decodedKey && !gameType && (
					<p>Game type not found for key: {decodedKey}</p>
				)}
				{!decodedKey && <p>Missing game type key.</p>}
				{gameType && (
					<>
						{hasWon && <p>Session complete.</p>}
						{sessionComplete && (
							<button
								type="button"
								className="start-over-button"
								onClick={() => gameType && startNewSession(gameType)}
							>
								Start over
							</button>
						)}
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
												(index === activePromptIndex
													? isMobile
														? currentAnswer
														: null
													: "")}
											{index === activePromptIndex &&
												!isMobile &&
												!message.answer && (
													<input
														ref={desktopInputRef}
														type="text"
														value={desktopInput}
														disabled={sessionComplete}
														onChange={(event) =>
															setDesktopInput(event.target.value)
														}
														onKeyDown={(event) => {
															if (event.key === "Enter") {
																handleDesktopSubmit();
															}
														}}
														placeholder="Type answer"
														className="inline-answer-input"
													/>
												)}
										</span>
									)}
								</p>
							))}
						</div>
						<GameInputArea
							isMobile={isMobile}
							sessionComplete={sessionComplete}
							onKeypadAppend={handleKeypadAppend}
							onKeypadBackspace={handleKeypadBackspace}
							onKeypadOk={handleKeypadOk}
							onReveal={handleReveal}
						/>
						{(progress || minutesLeft !== null) && (
							<div className="status-bar">
								{progress && (
									<div className="status-progress">
										<div>
											Points {progress.pointsTowardWin}/
											{progress.pointsRequiredToWin}
										</div>
										<div>
											Problems {progress.problemsAttempted}/
											{progress.minProblemsAttemptedToWin}
										</div>
									</div>
								)}
								{minutesLeft !== null && (
									<div className="status-timer">
										Minutes left: {minutesLeft}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</main>
		</div>
	);
}
