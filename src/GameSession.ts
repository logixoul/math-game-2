import type { FirebaseController } from './FirebaseController';
import { GameType, Prompt, PromptScheduler } from './GameTypes';
import { ResultStats } from './ResultStats';

export type GameSessionAppContext = {
    firebaseController: FirebaseController;
};

export type GameSessionUI = {
    updateProgressIndicator: () => void;
    showPrompt: () => void;
    updateSessionTimeIndicator: () => void;
    informUser: (message: string, color: string, isBold?: boolean) => void;
    onWin: (resultStats: ResultStats) => void;
};

export class GameSession {
    appController: GameSessionAppContext;
    gamePage: GameSessionUI;
    errorCount: number;
    gameType: GameType;
    numCorrectAtFirstTry: number;
    numWrongAtFirstTry: number;

    promptScheduler: PromptScheduler;
    promptGenerator: Generator<Prompt, void, unknown>;
    currentPrompt: Prompt;
    
    // from gpt suggestions (for winconditions):
    pointsTowardWin: number = 0;
    maxReachedPointsTowardWin: number = 0;
    problemsAttempted: number = 0;
    gameStartTimestamp: number = Date.now();
    
    readonly pointsRequiredToWin: number = 20;
    readonly minProblemsAttemptedToWin: number = 20;
    readonly maxSessionDurationMs: number = 10 * 60 * 1000; // 10 minutes
    
    constructor(appController: GameSessionAppContext, gamePage : GameSessionUI, gameType: GameType) {
        this.appController = appController;
        this.gamePage = gamePage;
        
        this.errorCount = 0;
        this.gameType = gameType;
        this.promptScheduler = new PromptScheduler(this.gameType);

        this.promptGenerator = this.promptScheduler.generatePrompts();
        this.currentPrompt = this.promptGenerator.next().value!;

        this.numCorrectAtFirstTry = 0;
        this.numWrongAtFirstTry = 0;
        
        this.errorCount = 0;
    }
    public getResultStats() {
        const timeElapsed = Date.now() - (this.gameStartTimestamp ?? 0);
        const total = this.numCorrectAtFirstTry + this.numWrongAtFirstTry;
        const percentCorrectOnFirstTry = Math.round(100 * this.numCorrectAtFirstTry / total);
        const percentCorrectOnFirstTry_Safe = total == 0 ? 0 : percentCorrectOnFirstTry;
        return new ResultStats(this.gameType, timeElapsed, percentCorrectOnFirstTry_Safe, this.pointsTowardWin, this.problemsAttempted, this.maxReachedPointsTowardWin)
    }
    win(): void {
        const stats = this.getResultStats();
        this.gamePage.onWin(stats);
        //this.appController.firebaseController.onGameEnd(stats);
    }

    nextQuestion(): void {
        this.currentPrompt = this.gameType.createRandomPrompt();
        this.gamePage.updateProgressIndicator();
        this.gamePage.showPrompt();
    }

    getCurrentPrompt(): Prompt {
        return this.currentPrompt;
    }
    winConditionsMet(): boolean {
        const enoughPoints: boolean = this.pointsTowardWin >= this.pointsRequiredToWin;
        const enoughAnswered: boolean = this.problemsAttempted >= this.minProblemsAttemptedToWin;
        const withinTimeLimit: boolean = (Date.now() - this.gameStartTimestamp) <= this.maxSessionDurationMs;
        return enoughPoints && enoughAnswered && withinTimeLimit;
    }
    onUserAnswered(userAnswer: number): void {
        if(userAnswer === this.currentPrompt.answer) {
            this.pointsTowardWin++;
            this.maxReachedPointsTowardWin = Math.max(this.pointsTowardWin, this.maxReachedPointsTowardWin);

            this.gamePage.informUser("✅ Точно така!", "#00c000");
            if(this.winConditionsMet()) {
                this.problemsAttempted++;
                this.gamePage.updateProgressIndicator();
                this.win();
                return;
            }
            else {
                this.nextQuestion();
            }
            this.problemsAttempted++;
            this.gamePage.updateProgressIndicator();

            if(this.currentPrompt.failedAttempts === 0) {
                this.numCorrectAtFirstTry++;
            }
        } else {
            this.numWrongAtFirstTry++;
            this.pointsTowardWin--;
            this.gamePage.updateProgressIndicator();

            this.errorCount++;
            this.gamePage.updateSessionTimeIndicator();
            this.gamePage.informUser("❌ Пробвай пак.", "black");
            this.gamePage.showPrompt();
            this.currentPrompt.failedAttempts++;
        }
    }


    onUserRequestedAnswerReveal(): void {
        this.pointsTowardWin-=2;
        this.problemsAttempted++;
        this.gamePage.updateProgressIndicator();

        const answer = this.getCurrentPrompt().answer;
        this.gamePage.informUser("Отговорът е "+answer+"", "#4ac");
        
        this.promptScheduler.postponePrompt(this.currentPrompt);

        this.errorCount++;
        this.gamePage.updateSessionTimeIndicator();

        this.getCurrentPrompt().failedAttempts++;
        this.nextQuestion();
    }
}
