import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GameType } from "../GameTypes";
import { FirebaseController } from "../FirebaseController";
import { GameSession, GameSessionUI } from "../GameSession";
import * as util from "../util";
import { AppController } from "../AppController";
import { GameInputArea } from "./GameInputArea";
import { TopBar } from "./TopBar";
import { ErrorPage } from "./ErrorPage";
import { MessageLog, Message } from "./MessageLog";
import styles from "./GameSessionPage.module.css";

type GameSessionPageProps = {
	gameType: GameType;
};

type ProgressSnapshot = {
	pointsTowardWin: number;
	problemsAttempted: number;
	pointsRequiredToWin: number;
	minProblemsAttemptedToWin: number;
};

export function GameSessionRoute() {
	const { gameTypeKey } = useParams<{ gameTypeKey: string }>();
	const decodedKey = decodeURIComponent(gameTypeKey!);
	const gameType = useMemo(() => {
		const gameTypes = AppController.getAvailableGameTypes();
		return (gameTypes.fifthGrade.concat(gameTypes.sixthGrade)).find(
			(type) => type.persistencyKey === decodedKey
		);
	}, [decodedKey]);
	if(!gameType) {
		return <ErrorPage></ErrorPage>;
	}

	return <GameSessionPage gameType={gameType} />;
}

export function GameSessionPage({
	gameType,
}: GameSessionPageProps) {
	const sessionRef = useRef<GameSession | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [progress, setProgress] = useState<ProgressSnapshot>({
		// todo: fix zeros?
		pointsTowardWin: 0,
		problemsAttempted: 0,
		pointsRequiredToWin: 0,
		minProblemsAttemptedToWin: 0,
	});
	const [minutesLeft, setMinutesLeft] = useState<number>(0);
	const [hasWon, setHasWon] = useState(false);
	const [sessionComplete, setSessionComplete] = useState(false);
	const [currentAnswer, setCurrentAnswer] = useState("");
	const [desktopInput, setDesktopInput] = useState("");
	const [activePromptIndex, setActivePromptIndex] = useState<number>(0); //todo 0
	const isMobile = useMemo(() => util.isMobileDevice(), []);
	const timedOutRef = useRef(false);
	const desktopInputRef = useRef<HTMLInputElement | null>(null);
	const ui = useMemo<GameSessionUI>(() => {
		return {
			informUser: (message, color, isBold) => {
				setMessages((prev) => [...prev, { text: message, color, isBold }]);
			},
			updateProgressIndicator: () => {
				syncProgressFromGameSession();
			},
			updateSessionTimeIndicator: () => {
				const session = getSession();
				const msLeft =
					session.maxSessionDurationMs -
					(Date.now() - session.gameStartTimestamp);
				setMinutesLeft(Math.max(0, Math.floor(msLeft / 60000)));
			},
			showPrompt: () => {
				const session = getSession();
				const prompt = session.getCurrentPrompt();
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
					{ text: "КЪРТИШ! ПОБЕДА! 🥳\nМоля направи скрийншот и ми го пратѝ.", color: "green", isBold: true },
					{
						text: `Отне ти ${minutes} мин ${seconds} сек. Познал си ${resultStats.percentCorrectOnFirstTry}% от първи опит.`,
						color: "black",
					},
				]);
			},
		};
	}, []);
	function getSession(): GameSession {
		const s = sessionRef.current;
		if (!s) throw new Error("Session not initialized");
		return s;
	}
	function getLog(): HTMLDivElement {
		const log = logRef.current;
		if (!log) throw new Error("Log not initialized");
		return log;
	}
	function syncProgressFromGameSession() {
		const session = getSession();
		setProgress({
			pointsTowardWin: session.pointsTowardWin,
			problemsAttempted: session.problemsAttempted,
			pointsRequiredToWin: session.pointsRequiredToWin,
			minProblemsAttemptedToWin: session.minProblemsAttemptedToWin,
		});
	}
	const startNewSession = (nextGameType: GameType) => {
		setMessages([]);
		setHasWon(false);
		setSessionComplete(false);
		setCurrentAnswer("");
		setDesktopInput("");
		setActivePromptIndex(0);
		timedOutRef.current = false;

		const firebaseController = new FirebaseController();
		void firebaseController.init();
		const appContext = { firebaseController };
		const session = new GameSession(appContext, ui, nextGameType);
		sessionRef.current = session;

		syncProgressFromGameSession();

		ui.updateProgressIndicator();
		ui.updateSessionTimeIndicator();
		ui.showPrompt();
	};

	useEffect(() => {
		startNewSession(gameType);
	}, [gameType, ui]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			const session = getSession();
			
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
					{ text: "Край на тренировката - честито! (времето изтече 🙂 )", color: "green", isBold: true },
					{ text: "(пратѝ ми скрийншот)", color: "green", isBold: true },
					{
						text: `Ти игра "${stats.gameType.localizedName}".`,
						color: "black",
					},
					{
						text: `Точки: ${stats.pointsTowardWin}.`,
						color: "black",
					},
					{
						text: `Максимални достигнати точки: ${stats.maxReachedPointsTowardWin}.`,
						color: "black",
					},
					{
						text: `Познати от първи опит: ${stats.percentCorrectOnFirstTry}%.`,
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
		const log = getLog();
		log.scrollTop = log.scrollHeight;
	}, [messages, currentAnswer]);

	useEffect(() => {
		if (isMobile || sessionComplete) return;
		desktopInputRef.current?.focus();
	}, [activePromptIndex, isMobile, sessionComplete]);

	const submitAnswer = (text: string) => {
		const session = getSession();
		if (sessionComplete) return;
		
		setMessages((prev) => {
			if (activePromptIndex === null) return prev;
			return prev.map((message, index) =>
				index === activePromptIndex
					? { ...message, answer: text }
					: message
			);
		});
		setCurrentAnswer("");
		setDesktopInput("");
		const numeric = Number.parseInt(text, 10);
		if (Number.isNaN(numeric)) return;
		session.onUserAnswered(numeric);
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
		<div className={"page"}>
			<TopBar />
			<main className={styles.content}>
				{sessionComplete && (
					<button
						type="button"
						className={styles.startOverButton}
						onClick={() => startNewSession(gameType)}
					>
						Отначало
					</button>
				)}
				<MessageLog
					messages={messages}
					activePromptIndex={activePromptIndex}
					isMobile={isMobile}
					currentAnswer={currentAnswer}
					desktopInput={desktopInput}
					sessionComplete={sessionComplete}
					logRef={logRef}
					desktopInputRef={desktopInputRef}
					onDesktopInputChange={setDesktopInput}
					onDesktopSubmit={handleDesktopSubmit}
				/>
			</main>
			{progress && (
				<div className={styles.bottomPane}>
					<GameInputArea
						isMobile={isMobile}
						sessionComplete={sessionComplete}
						onKeypadAppend={handleKeypadAppend}
						onKeypadBackspace={handleKeypadBackspace}
						onKeypadOk={handleKeypadOk}
						onReveal={handleReveal}
					/>
					<div className={styles.statusBar}>
						{progress && (
							<div className={styles.statusProgress}>
								<div>
									<b>Точки: {util.ensureTextContainsSign(progress.pointsTowardWin)}</b>.<br />
									За победа ти трябват още {progress.pointsRequiredToWin - progress.pointsTowardWin} точки и {progress.minProblemsAttemptedToWin - progress.problemsAttempted} пробвани задачи
								</div>
							</div>
						)}
						<div className={styles.statusTimer}>
							Имаш още {minutesLeft} минути
						</div>
					</div>

				</div>
			)}
		</div>
	);
}
