import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as GameTypes from "@/logic/GameTypes";
import { GameSession, GameSessionUI } from "@/logic/GameSession";
import * as util from "@/logic/util";
import { KeyPad } from "@/components/KeyPad";
import { TopBar } from "@/components/TopBar";
import { ErrorPage } from "./ErrorPage";
import { MessageLog, Message } from "@/components/MessageLog";
import { attachWakeLock } from "@/React/WakeLock";
import styles from "./GameSessionPage.module.css";
import { firebaseController } from "@/logic/FirebaseController";
import { BigNumber } from "bignumber.js";

type GameSessionPageProps = {
	gameType: GameTypes.GameType;
	assignmentId?: string;
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
		const gameTypesCategorized = GameTypes.getAvailableGameTypes();
		const gameTypes = Object.values(gameTypesCategorized).flat();
		return gameTypes.find(
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
	assignmentId,
}: GameSessionPageProps) {
	const sessionRef = useRef<GameSession | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);
	const hasRecordedAttemptRef = useRef(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [progress, setProgress] = useState<ProgressSnapshot>({
		// todo: fix zeros?
		pointsTowardWin: 0,
		problemsAttempted: 0,
		pointsRequiredToWin: 0,
		minProblemsAttemptedToWin: 0,
	});
	const [minutesLeft, setMinutesLeft] = useState<number>(0);
	const [sessionComplete, setSessionComplete] = useState(false);
	const [currentAnswer, setCurrentAnswer] = useState("");
	const [activePromptIndex, setActivePromptIndex] = useState<number>(0); //todo 0
	const timedOutRef = useRef(false);
	const gameTypeByKey = useMemo(() => {
		const gameTypes = GameTypes.getAvailableGameTypes();
		return new Map(
			gameTypes.fifthGrade.concat(gameTypes.sixthGrade).map((type) => [type.persistencyKey, type])
		);
	}, []);
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
				setMinutesLeft(Math.max(0, Math.ceil(msLeft / 60000)));
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
			},
			onWin: (resultStats) => {
				setSessionComplete(true);
				if (!hasRecordedAttemptRef.current) {
					hasRecordedAttemptRef.current = true;
					firebaseController.recordAttempt(assignmentId, resultStats, "win").catch(() => { });
				}
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
	}, [assignmentId]);
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
	const startNewSession = (nextGameType: GameTypes.GameType) => {
		setMessages([]);
		setSessionComplete(false);
		setCurrentAnswer("");
		setActivePromptIndex(0);
		timedOutRef.current = false;

		const session = new GameSession(ui, nextGameType);
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
		const wakeLock = attachWakeLock();
		return () => wakeLock.dispose();
	}, []);

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
				if (!hasRecordedAttemptRef.current) {
					hasRecordedAttemptRef.current = true;
					firebaseController.recordAttempt(assignmentId, stats, "timeout").catch(() => { });
				}
				setMessages((prev) => [
					...prev,
					{ text: "Край на тренировката - честито! (времето изтече 🙂 )", color: "green", isBold: true },
					{ text: "(пратѝ ми скрийншот)", color: "green", isBold: true },
					{
						text: `Ти игра "${gameTypeByKey.get(stats.gameTypeKey)?.uiLabel ?? stats.gameTypeKey}".`,
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
		session.onUserAnswered(text);
	};

	const handleKeypadOk = () => {
		submitAnswer(currentAnswer);
	};

	const handleKeypadAppend = (value: string) => {
		setCurrentAnswer((prev) => {
			return prev + value;
		});
	};

	const handleKeypadBackspace = () => {
		setCurrentAnswer((prev) => prev.slice(0, -1));
	};

	const handleReveal = () => {
		sessionRef.current?.onUserRequestedAnswerReveal();
	};

	
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const parsedInt = parseInt(e.key, 10);
			if(!Number.isNaN(parsedInt) || e.key == "-") {
				handleKeypadAppend(e.key);
			}
			else if(e.key == "Enter") {
				handleKeypadOk();
			} else if(e.key == "Backspace") {
				handleKeypadBackspace();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleKeypadAppend, handleKeypadBackspace, handleKeypadOk]);

	return (
		<>
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
				currentAnswer={currentAnswer}
				logRef={logRef}
			/>
			<div className={styles.bottomPane}>
				{
					!sessionComplete
					?
						util.isMobileDevice()
						?
							<KeyPad
								onKeypadAppend={handleKeypadAppend}
								onKeypadBackspace={handleKeypadBackspace}
								onKeypadOk={(handleKeypadOk)}
								onReveal={handleReveal}
							/>
						:
							<button type="button" className={styles.revealButton} onClick={handleReveal}>Не знам</button>
					: null
				}
				<div className={styles.statusBar}>
					<div className={styles.statusProgress}>
						<div>
							<b>Точки: {util.ensureTextContainsSign(progress.pointsTowardWin)}</b>.<br />
							За победа ти трябват още {progress.pointsRequiredToWin - progress.pointsTowardWin} точки и {progress.minProblemsAttemptedToWin - progress.problemsAttempted} пробвани задачи
						</div>
					</div>
					<div className={styles.statusTimer}>
						Имаш още {minutesLeft} минути
					</div>
				</div>

			</div>
		</>
	);
}

