import type { Message } from "@/logic/Message";
import { BigNumber } from "bignumber.js";
import { AssignmentProblemGenerator } from "./assignments";
import type { Problem } from "./Problems/ProblemGenerators";
import { ProblemScheduler } from "./Problems/ProblemScheduler";
import type { ResultStats } from "./ResultStats";

type GameSessionListener = () => void;

type ProblemSnapshot = {
	text: string;
	answerText: string;
	failedAttempts: number;
};

export type GameSessionSnapshot = {
	errorCount: number;
	numCorrectAtFirstTry: number;
	numWrongAtFirstTry: number;
	pointsTowardWin: number;
	maxReachedPointsTowardWin: number;
	problemsAttempted: number;
	minutesLeft: number;
	status: "playing" | "won" | "timeout";
	resultStats: ResultStats | null;
	gameStartTimestamp: number;
	pointsRequiredToWin: number;
	minProblemsAttemptedToWin: number;
	maxSessionDurationMs: number;
	currentProblem: ProblemSnapshot;
	messages: Message[];
	activePromptIndex: number | null;
};

export class GameSession {
	errorCount: number;
	problemGenerator: AssignmentProblemGenerator;
	numCorrectAtFirstTry: number;
	numWrongAtFirstTry: number;

	problemScheduler: ProblemScheduler;
	problemIterator: Generator<Problem, void, unknown>;
	currentProblem: Problem;
	messages: Message[];
	activePromptIndex: number | null;

	// from gpt suggestions (for winconditions):
	pointsTowardWin: number = 0;
	maxReachedPointsTowardWin: number = 0;
	problemsAttempted: number = 0;
	minutesLeft: number;
	status: "playing" | "won" | "timeout" = "playing";
	resultStats: ResultStats | null = null;
	gameStartTimestamp: number = Date.now();

	readonly pointsRequiredToWin: number = 20;
	readonly minProblemsAttemptedToWin: number = 20;
	readonly maxSessionDurationMs: number = 10 * 60 * 1000; // 10 minutes

	private listeners = new Set<GameSessionListener>();
	private snapshot: GameSessionSnapshot;

	constructor(problemGenerator: AssignmentProblemGenerator) {
		this.errorCount = 0;
		this.problemGenerator = problemGenerator;
		this.problemScheduler = new ProblemScheduler(this.problemGenerator);

		this.problemIterator = this.problemScheduler.generateProblems();
		this.currentProblem = this.problemIterator.next().value!;
		this.messages = [];
		this.activePromptIndex = null;

		this.numCorrectAtFirstTry = 0;
		this.numWrongAtFirstTry = 0;
		this.minutesLeft = Math.max(
			0,
			Math.ceil(this.maxSessionDurationMs / 60000),
		);

		this.errorCount = 0;
		this.showProblem();
		this.snapshot = this.buildSnapshot();
	}

	private buildSnapshot(): GameSessionSnapshot {
		return {
			errorCount: this.errorCount,
			numCorrectAtFirstTry: this.numCorrectAtFirstTry,
			numWrongAtFirstTry: this.numWrongAtFirstTry,
			pointsTowardWin: this.pointsTowardWin,
			maxReachedPointsTowardWin: this.maxReachedPointsTowardWin,
			problemsAttempted: this.problemsAttempted,
			minutesLeft: this.minutesLeft,
			status: this.status,
			resultStats: this.resultStats,
			gameStartTimestamp: this.gameStartTimestamp,
			pointsRequiredToWin: this.pointsRequiredToWin,
			minProblemsAttemptedToWin: this.minProblemsAttemptedToWin,
			maxSessionDurationMs: this.maxSessionDurationMs,
			currentProblem: {
				text: this.currentProblem.text,
				answerText: this.currentProblem.answer.toString(),
				failedAttempts: this.currentProblem.failedAttempts,
			},
			messages: this.messages,
			activePromptIndex: this.activePromptIndex,
		};
	}

	private notify(): void {
		this.snapshot = this.buildSnapshot();
		for (const listener of this.listeners) {
			listener();
		}
	}

	subscribe = (listener: GameSessionListener): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	getSnapshot = (): GameSessionSnapshot => this.snapshot;

	tick(nowMs: number): void {
		if (this.status !== "playing") return;
		const msLeft =
			this.maxSessionDurationMs - (nowMs - this.gameStartTimestamp);
		const nextMinutesLeft = Math.max(0, Math.ceil(msLeft / 60000));
		if (nextMinutesLeft !== this.minutesLeft) {
			this.minutesLeft = nextMinutesLeft;
			if (msLeft > 0) {
				this.notify();
			}
		}
		if (msLeft <= 0) {
			this.timeout();
		}
	}

	private computeResultStats(): ResultStats {
		const timeElapsed = Date.now() - (this.gameStartTimestamp ?? 0);
		const total = this.numCorrectAtFirstTry + this.numWrongAtFirstTry;
		const percentCorrectOnFirstTry = Math.round(
			(100 * this.numCorrectAtFirstTry) / total,
		);
		const percentCorrectOnFirstTry_Safe =
			total === 0 ? 0 : percentCorrectOnFirstTry;
		return {
			assignmentUiLabel: this.problemGenerator.persistencyKey,
			timeElapsedMs: timeElapsed,
			percentCorrectOnFirstTry: percentCorrectOnFirstTry_Safe,
			pointsTowardWin: this.pointsTowardWin,
			problemsAttempted: this.problemsAttempted,
			maxReachedPointsTowardWin: this.maxReachedPointsTowardWin,
		};
	}

	private addWinMessages(stats: ResultStats): void {
		const minutes = Math.floor(stats.timeElapsedMs / 60000);
		const seconds = Math.floor(stats.timeElapsedMs / 1000) % 60;
		this.messages = [
			...this.messages,
			{
				text: "КЪРТИШ! ПОБЕДА! 🥳\nМоля направи скрийншот и ми го пратѝ.",
				color: "green",
				isBold: true,
			},
			{
				text: `Отне ти ${minutes} мин ${seconds} сек. Познал си ${stats.percentCorrectOnFirstTry}% от първи опит.`,
				color: "white",
			},
		];
	}

	private addTimeoutMessages(stats: ResultStats): void {
		this.messages = [
			...this.messages,
			{
				text: "Край на тренировката - честито! (времето изтече 🙂 )",
				color: "green",
				isBold: true,
			},
			{ text: "(пратѝ ми скрийншот)", color: "green", isBold: true },
			{
				text: `Ти игра "${stats.assignmentUiLabel}".`,
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
		];
	}

	private endSession(status: "won" | "timeout"): void {
		if (this.status !== "playing") return;
		this.status = status;
		this.resultStats = this.computeResultStats();
		if (status === "won") {
			this.addWinMessages(this.resultStats);
		} else {
			this.addTimeoutMessages(this.resultStats);
		}
		this.notify();
	}

	private informUser(message: string, color: string, isBold?: boolean): void {
		this.messages = [...this.messages, { text: message, color, isBold }];
	}

	private showProblem(): void {
		const prompt = this.getCurrentProblem();
		const nextIndex = this.messages.length;
		this.messages = [
			...this.messages,
			{ text: `${prompt.text} = `, color: "white", isPrompt: true },
		];
		this.activePromptIndex = nextIndex;
	}

	private setActivePromptAnswer(answer: string): void {
		if (this.activePromptIndex === null) return;
		this.messages = this.messages.map((message, index) =>
			index === this.activePromptIndex ? { ...message, answer } : message,
		);
	}

	win(): void {
		this.endSession("won");
	}

	timeout(): void {
		this.endSession("timeout");
	}

	private takeNextProblemFromIterator(): void {
		this.currentProblem = this.problemIterator.next().value!;
	}

	private advanceAndPrompt(): void {
		this.takeNextProblemFromIterator();
		this.showProblem();
	}

	nextQuestion(): void {
		this.advanceAndPrompt();
		this.notify();
	}

	getCurrentProblem(): Problem {
		return this.currentProblem;
	}

	winConditionsMet(): boolean {
		const enoughPoints: boolean =
			this.pointsTowardWin >= this.pointsRequiredToWin;
		const enoughAnswered: boolean =
			this.problemsAttempted >= this.minProblemsAttemptedToWin;
		const withinTimeLimit: boolean =
			Date.now() - this.gameStartTimestamp <= this.maxSessionDurationMs;
		return enoughPoints && enoughAnswered && withinTimeLimit;
	}

	onUserAnswered(userAnswerText: string): void {
		this.setActivePromptAnswer(userAnswerText);
		userAnswerText = userAnswerText.replace(",", ".");
		const userAnswer = new BigNumber(userAnswerText);
		if (userAnswer.isNaN()) {
			this.informUser("Това не е число!", "white", true);
			this.showProblem();
			this.notify();
			return;
		}
		if (userAnswer.isEqualTo(this.currentProblem.answer)) {
			const solvedOnFirstTry = this.currentProblem.failedAttempts === 0;

			this.pointsTowardWin++;
			this.maxReachedPointsTowardWin = Math.max(
				this.pointsTowardWin,
				this.maxReachedPointsTowardWin,
			);
			if (solvedOnFirstTry) {
				this.numCorrectAtFirstTry++;
			} else {
				this.numWrongAtFirstTry++;
			}

			this.informUser("Точно така!", "#00c000");
			if (this.winConditionsMet()) {
				this.problemsAttempted++;
				this.win();
				return;
			} else {
				this.advanceAndPrompt();
			}
			this.problemsAttempted++;
		} else {
			this.pointsTowardWin--;

			this.errorCount++;
			this.informUser("Пробвай пак.", "#ff4020");
			this.showProblem();
			this.currentProblem.failedAttempts++;
		}
		this.notify();
	}

	onUserRequestedAnswerReveal(): void {
		this.pointsTowardWin -= 1;
		this.problemsAttempted++;

		const answer = this.getCurrentProblem().answer;
		this.setActivePromptAnswer("");
		this.informUser(`Отговорът е ${answer}`, "#4ac");

		this.problemScheduler.postponeProblem(this.currentProblem);

		this.errorCount++;

		this.getCurrentProblem().failedAttempts++;
		this.advanceAndPrompt();
		this.notify();
	}
}
