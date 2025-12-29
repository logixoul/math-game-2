import type { AppController } from './AppController';
import { GameType, GameTypeCtor, Prompt, PromptScheduler } from './GameTypes';
import { ResultStats } from './ResultStats';
import type { UIController } from './UI';
import { GameSessionPage } from './Pages/GameSessionPage';

export class GameSession {
    appController: AppController;
    gamePage: GameSessionPage;
    errorCount: number;
    gameType: GameType;
    numCorrectAtFirstTry: number;
    numWrongAtFirstTry: number;

    promptScheduler: PromptScheduler;
    promptGenerator: Generator<Prompt, void, unknown>;
    currentPrompt: Prompt;
    
    // from gpt suggestions (for winconditions):
    pointsTowardWin: number = 0;
    problemsCompleted: number = 0;
    gameStartTimestamp: number = Date.now();
    
    readonly pointsRequiredToWin: number = 1;
    readonly minproblemsCompletedToWin: number = 2;
    readonly maxSessionDurationMs: number = 10 * 60 * 1000; // 10 minutes
    
    constructor(appController: AppController, gamePage : GameSessionPage, gameType: GameType) {
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

    win(): void {
        this.gamePage.informUser("КЪРТИШ! ПОБЕДА! 🥳", "green", true);
        const timeElapsed = Date.now() - (this.gameStartTimestamp ?? 0);
        const total = this.numCorrectAtFirstTry + this.numWrongAtFirstTry;
        const percentCorrectOnFirstTry = Math.round(100 * this.numCorrectAtFirstTry / total);
        this.gamePage.onWin(new ResultStats(this.gameType, timeElapsed, percentCorrectOnFirstTry));

        this.appController.firebaseController.onGameEnd(new ResultStats(this.gameType, timeElapsed, percentCorrectOnFirstTry));
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
        const enoughAnswered: boolean = this.problemsCompleted >= this.minproblemsCompletedToWin;
        const withinTimeLimit: boolean = (Date.now() - this.gameStartTimestamp) <= this.maxSessionDurationMs;
        return enoughPoints && enoughAnswered && withinTimeLimit;
    }
    onUserAnswered(userAnswer: number): void {
        if(userAnswer === this.currentPrompt.answer) {
            this.pointsTowardWin++;
            this.gamePage.informUser("✅ Точно така!", "#00c000");
            if(this.winConditionsMet()) {
                this.problemsCompleted++;
                this.gamePage.updateProgressIndicator();
                this.win();
                return;
            }
            else {
                this.nextQuestion();
            }
            this.problemsCompleted++;
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
        this.problemsCompleted++;
        this.gamePage.updateProgressIndicator();

        const answer = this.getCurrentPrompt().answer;
        this.gamePage.informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
        
        this.promptScheduler.postponePrompt(this.currentPrompt);

        this.errorCount++;
        this.gamePage.updateSessionTimeIndicator();

        this.getCurrentPrompt().failedAttempts++;
        this.nextQuestion();
    }
}
