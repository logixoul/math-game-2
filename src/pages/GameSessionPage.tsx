import { KeyPad } from "@/components/KeyPad";
import { MessageLog } from "@/components/MessageLog";
import type { AssignmentProblemGenerator } from "@/logic/assignments";
import { recordAttempt } from "@/logic/attempts";
import {
	useAuthUser,
} from "@/logic/auth";
import { GameSession } from "@/logic/GameSession";
import {
	getGameSessionMaxDurationMs,
	useUserSettings,
} from "@/logic/userSettings";
import * as util from "@/logic/util";
import { attachWakeLock } from "@/React/WakeLock";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import styles from "./GameSessionPage.module.css";

type GameSessionPageProps = {
	problemGenerator: AssignmentProblemGenerator;
	assignmentId?: string;
};

export function GameSessionPage({
	problemGenerator,
	assignmentId,
}: GameSessionPageProps) {
	const user = useAuthUser();
	const userSettings = useUserSettings(user?.uid);
	const maxSessionDurationMs = getGameSessionMaxDurationMs(userSettings);
	const [session, setSession] = useState(
		() =>
			new GameSession(problemGenerator, {
				maxSessionDurationMs,
			}),
	);
	const logRef = useRef<HTMLDivElement | null>(null);
	const hasRecordedAttemptRef = useRef(false);
	const [currentAnswer, setCurrentAnswer] = useState("");

	const startNewSession = useCallback(
		(nextProblemGenerator: AssignmentProblemGenerator) => {
			hasRecordedAttemptRef.current = false;
			setCurrentAnswer("");
			setSession(
				new GameSession(nextProblemGenerator, {
					maxSessionDurationMs,
				}),
			);
		},
		[maxSessionDurationMs],
	);

	useEffect(() => {
		session.setMaxSessionDurationMs(maxSessionDurationMs);
	}, [maxSessionDurationMs, session]);

	useEffect(() => {
		if (session.problemGenerator === problemGenerator) return;
		startNewSession(problemGenerator);
	}, [problemGenerator, session, startNewSession]);

	const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
	const sessionComplete = snap.status !== "playing";

	useEffect(() => {
		const wakeLock = attachWakeLock();
		return () => wakeLock.dispose();
	}, []);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			session.tick(Date.now());
		}, 1000);
		return () => {
			window.clearInterval(intervalId);
		};
	}, [session]);

	useEffect(() => {
		if (
			user &&
			(snap.status === "won" || snap.status === "timeout") &&
			snap.resultStats &&
			!hasRecordedAttemptRef.current
		) {
			hasRecordedAttemptRef.current = true;
			const completionReason = snap.status === "won" ? "win" : "timeout";
			recordAttempt(
				user.uid,
				assignmentId,
				snap.resultStats,
				completionReason,
			).catch(() => {});
		}
	}, [assignmentId, snap.resultStats, snap.status, user]);

	useEffect(() => {
		const log = logRef.current;
		if (!log) return;
		const rafId = window.requestAnimationFrame(() => {
			log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
		});
		return () => window.cancelAnimationFrame(rafId);
	}, [snap.messages.length]);

	const submitAnswer = useCallback(
		(text: string) => {
			if (snap.status !== "playing") return;
			setCurrentAnswer("");
			session.onUserAnswered(text);
		},
		[session, snap.status],
	);

	const handleKeypadOk = useCallback(() => {
		submitAnswer(currentAnswer);
	}, [currentAnswer, submitAnswer]);

	const handleKeypadAppend = useCallback((value: string) => {
		setCurrentAnswer((prev) => {
			return prev + value;
		});
	}, []);

	const handleKeypadBackspace = useCallback(() => {
		setCurrentAnswer((prev) => prev.slice(0, -1));
	}, []);

	const handleReveal = () => {
		if (snap.status !== "playing") return;
		setCurrentAnswer("");
		session.onUserRequestedAnswerReveal();
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			const parsedInt = parseInt(e.key, 10);
			if (!Number.isNaN(parsedInt) || e.key === "-" || e.key === ",") {
				handleKeypadAppend(e.key);
			} else if (e.key === "Enter") {
				handleKeypadOk();
			} else if (e.key === "Backspace") {
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
				messages={snap.messages}
				activePromptIndex={snap.activePromptIndex}
				currentAnswer={currentAnswer}
				logRef={logRef}
			/>
			<div className={styles.bottomPane}>
				{!sessionComplete ? (
					util.isMobileDevice() ? (
						<KeyPad
							onKeypadAppend={handleKeypadAppend}
							onKeypadBackspace={handleKeypadBackspace}
							onKeypadOk={handleKeypadOk}
							onReveal={handleReveal}
						/>
					) : (
						<button
							type="button"
							className={styles.revealButton}
							onClick={handleReveal}
						>
							Не знам
						</button>
					)
				) : null}
				<div className={styles.statusBar}>
					<div className={styles.statusProgress}>
						<div>
							<span className={styles.pointsIndicator}>
								Точки: {util.ensureTextContainsSign(snap.pointsTowardWin)}
							</span>
							&nbsp;&nbsp;|&nbsp;&nbsp;
							<span className={styles.errorsIndicator}>
								Грешки: {snap.errorCount}
							</span>
							<br />
							За победа ти трябват още{" "}
							{snap.pointsRequiredToWin - snap.pointsTowardWin} точки и{" "}
							{snap.minProblemsAttemptedToWin - snap.problemsAttempted} пробвани
							задачи
						</div>
					</div>
					<div className={styles.statusTimer}>
						Имаш още {snap.minutesLeft} минути
					</div>
				</div>
			</div>
		</div>
	);
}
