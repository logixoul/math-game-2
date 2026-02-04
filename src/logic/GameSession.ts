import { BigNumber } from "bignumber.js";
import type { Problem, ProblemGenerator } from "./Problems/ProblemGenerators";
import { ProblemScheduler } from "./problems/ProblemScheduler";
import type { ResultStats } from "./ResultStats";

export type GameSessionUI = {
	updateProgressIndicator: () => void;
	showProblem: () => void;
	updateSessionTimeIndicator: () => void;
	informUser: (message: string, color: string, isBold?: boolean) => void;
	onWin: (resultStats: ResultStats) => void;
};

export class GameSession {
	gamePage: GameSessionUI;
	errorCount: number;
	problemGenerator: ProblemGenerator;
	numCorrectAtFirstTry: number;
	numWrongAtFirstTry: number;

	problemScheduler: ProblemScheduler;
	problemIterator: Generator<Problem, void, unknown>;
	currentProblem: Problem;

	// from gpt suggestions (for winconditions):
	pointsTowardWin: number = 0;
	maxReachedPointsTowardWin: number = 0;
	problemsAttempted: number = 0;
	gameStartTimestamp: number = Date.now();

	readonly pointsRequiredToWin: number = 20;
	readonly minProblemsAttemptedToWin: number = 20;
	readonly maxSessionDurationMs: number = 10 * 60 * 1000; // 10 minutes

	constructor(gamePage: GameSessionUI, problemGenerator: ProblemGenerator) {
		this.gamePage = gamePage;

		this.errorCount = 0;
		this.problemGenerator = problemGenerator;
		this.problemScheduler = new ProblemScheduler(this.problemGenerator);

		this.problemIterator = this.problemScheduler.generateProblems();
		this.currentProblem = this.problemIterator.next().value!;

		this.numCorrectAtFirstTry = 0;
		this.numWrongAtFirstTry = 0;

		this.errorCount = 0;
	}
	public getResultStats(): ResultStats {
		const timeElapsed = Date.now() - (this.gameStartTimestamp ?? 0);
		const total = this.numCorrectAtFirstTry + this.numWrongAtFirstTry;
		const percentCorrectOnFirstTry = Math.round(
			(100 * this.numCorrectAtFirstTry) / total,
		);
		const percentCorrectOnFirstTry_Safe =
			total === 0 ? 0 : percentCorrectOnFirstTry;
		return {
			problemGeneratorKey: this.problemGenerator.persistencyKey,
			timeElapsedMs: timeElapsed,
			percentCorrectOnFirstTry: percentCorrectOnFirstTry_Safe,
			pointsTowardWin: this.pointsTowardWin,
			problemsAttempted: this.problemsAttempted,
			maxReachedPointsTowardWin: this.maxReachedPointsTowardWin,
		};
	}
	win(): void {
		const stats = this.getResultStats();
		this.gamePage.onWin(stats);
		//firebaseController.onGameEnd(stats);
	}

	nextQuestion(): void {
		this.currentProblem = this.problemGenerator.createRandomProblem();
		this.gamePage.updateProgressIndicator();
		this.gamePage.showProblem();
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
		userAnswerText = userAnswerText.replace(",", ".");
		const userAnswer = new BigNumber(userAnswerText);
		if (userAnswer.isNaN()) {
			this.gamePage.informUser("Това не е число!", "white", true);
			this.gamePage.showProblem();
			return;
		}
		if (userAnswer.isEqualTo(this.currentProblem.answer)) {
			this.pointsTowardWin++;
			this.maxReachedPointsTowardWin = Math.max(
				this.pointsTowardWin,
				this.maxReachedPointsTowardWin,
			);

			this.gamePage.informUser("Точно така!", "#00c000");
			if (this.winConditionsMet()) {
				this.problemsAttempted++;
				this.gamePage.updateProgressIndicator();
				this.win();
				return;
			} else {
				this.nextQuestion();
			}
			this.problemsAttempted++;
			this.gamePage.updateProgressIndicator();

			if (this.currentProblem.failedAttempts === 0) {
				this.numCorrectAtFirstTry++;
			}
		} else {
			this.numWrongAtFirstTry++;
			this.pointsTowardWin--;

			this.errorCount++;
			this.gamePage.updateProgressIndicator();
			this.gamePage.updateSessionTimeIndicator();
			this.gamePage.informUser("Пробвай пак.", "#ff4020");
			this.gamePage.showProblem();
			this.currentProblem.failedAttempts++;
		}
	}

	onUserRequestedAnswerReveal(): void {
		this.pointsTowardWin -= 1;
		this.problemsAttempted++;
		this.gamePage.updateProgressIndicator();

		const answer = this.getCurrentProblem().answer;
		this.gamePage.informUser(`Отговорът е ${answer}`, "#4ac");

		this.problemScheduler.postponeProblem(this.currentProblem);

		this.errorCount++;
		this.gamePage.updateSessionTimeIndicator();

		this.getCurrentProblem().failedAttempts++;
		this.nextQuestion();
	}
}
