import { useEffect, useMemo, useRef, useState } from "react";
import * as ProblemGenerators from "@/logic/ProblemGenerators";
import { GameSession, GameSessionUI } from "@/logic/GameSession";
import * as util from "@/logic/util";
import { KeyPad } from "@/components/KeyPad";
import { MessageLog, Message } from "@/components/MessageLog";
import { attachWakeLock } from "@/React/WakeLock";
import styles from "./GameSessionPage.module.css";
import { firebaseController } from "@/logic/FirebaseController";

const getNow = () => Date.now();

type GameSessionPageProps = {
	problemGenerator: ProblemGenerators.ProblemGenerator;
	assignmentId?: string;
};

type ProgressSnapshot = {
	pointsTowardWin: number;
	problemsAttempted: number;
	pointsRequiredToWin: number;
	minProblemsAttemptedToWin: number;
	errorCount: number;
};

export function GameSessionPage({
	problemGenerator,
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
		errorCount: 0,
	});
	const [minutesLeft, setMinutesLeft] = useState<number>(0);
	const [sessionComplete, setSessionComplete] = useState(false);
	const [currentAnswer, setCurrentAnswer] = useState("");
	const [activePromptIndex, setActivePromptIndex] = useState<number>(0); //todo 0
	const timedOutRef = useRef(false);
	const problemGeneratorByKey = useMemo(() => {
		const generators = ProblemGenerators.getAvailableProblemGenerators();
		return new Map(
			generators.fifthGrade
				.concat(generators.sixthGrade)
				.map((generator) => [generator.persistencyKey, generator])
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
					(getNow() - session.gameStartTimestamp);
				setMinutesLeft(Math.max(0, Math.ceil(msLeft / 60000)));
			},
			showProblem: () => {
				const session = getSession();
				const prompt = session.getCurrentProblem();
				setMessages((prev) => {
					const nextIndex = prev.length;
					setActivePromptIndex(nextIndex);
					return [
						...prev,
						{ text: `${prompt.text} = `, color: "white", isPrompt: true },
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
						color: "white",
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
	function syncProgressFromGameSession() {
		const session = getSession();
		setProgress({
			pointsTowardWin: session.pointsTowardWin,
			problemsAttempted: session.problemsAttempted,
			pointsRequiredToWin: session.pointsRequiredToWin,
			minProblemsAttemptedToWin: session.minProblemsAttemptedToWin,
			errorCount: session.errorCount,
		});
	}
	const startNewSession = (nextProblemGenerator: ProblemGenerators.ProblemGenerator) => {
		setMessages([]);
		setSessionComplete(false);
		setCurrentAnswer("");
		setActivePromptIndex(0);
		timedOutRef.current = false;

		const session = new GameSession(ui, nextProblemGenerator);
		sessionRef.current = session;

		syncProgressFromGameSession();

		ui.updateProgressIndicator();
		ui.updateSessionTimeIndicator();
		ui.showProblem();
	};

	useEffect(() => {
		startNewSession(problemGenerator);
	}, [problemGenerator, ui]);

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
				(getNow() - session.gameStartTimestamp);
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
						text: `Ти игра "${problemGeneratorByKey.get(stats.problemGeneratorKey)?.uiLabel ?? stats.problemGeneratorKey}".`,
						color: "white",
					},
					{
						text: `Точки: ${stats.pointsTowardWin}.`,
						color: "white",
					},
					{
						text: `Максимални достигнати точки: ${stats.maxReachedPointsTowardWin}.`,
						color: "white",
					},
					{
						text: `Познати от първи опит: ${stats.percentCorrectOnFirstTry}%.`,
						color: "white",
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
		const rafId = window.requestAnimationFrame(() => {
			log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
		});
		return () => window.cancelAnimationFrame(rafId);
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
			if(!Number.isNaN(parsedInt) || e.key == "-" || e.key == "," ) {
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
		<div className={styles.gameSessionPage}>
			{sessionComplete && (
				<button
					type="button"
					className={styles.startOverButton}
					onClick={() => startNewSession(problemGenerator)}
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
							<span className={styles.pointsIndicator}>Точки: {util.ensureTextContainsSign(progress.pointsTowardWin)}</span>
							&nbsp;&nbsp;|&nbsp;&nbsp;
							<span className={styles.errorsIndicator}>Грешки: {progress.errorCount}</span><br />
							За победа ти трябват още {progress.pointsRequiredToWin - progress.pointsTowardWin} точки и {progress.minProblemsAttemptedToWin - progress.problemsAttempted} пробвани задачи
						</div>
					</div>
					<div className={styles.statusTimer}>
						Имаш още {minutesLeft} минути
					</div>
				</div>

			</div>
		</div>
	);
}

