import type { AppController } from './AppController';
import type { GameType, GameTypeCtor, Prompt } from './GameTypes';
import { ResultStats } from './ResultStats';
import type { UIController } from './UI';

export class GameSession {
    appController: AppController;
    uiController: UIController;
    errorCount: number;
    gameType: GameType;
    currentPromptIndex: number; // todo rm
    numCorrectAtFirstTry: number;

    promptGenerator: Generator<Prompt, void, unknown>;
    currentPrompt: Prompt;
    
    // from gpt suggestions (for winconditions):
    pointsTowardWin: number = 0;
    problemsCompleted: number = 0;
    gameStartTimestamp: number = Date.now();
    
    readonly pointsRequiredToWin: number = 20;
    readonly minproblemsCompletedToWin: number = 20;
    readonly maxSessionDurationMs: number = 10 * 60 * 1000; // 10 minutes
    

    constructor(appController: AppController, gameTypeClass: GameTypeCtor) {
        this.appController = appController;
        this.uiController = appController.uiController;
        
        this.errorCount = 0;
        this.gameType = new gameTypeClass();

        this.promptGenerator = this.gameType.createNextPrompt();
        this.currentPrompt = this.promptGenerator.next().value!;

        this.currentPromptIndex = 0;
        this.numCorrectAtFirstTry = 0;
        this.uiController.gameSession = this;
        this.uiController.onNewSession();

        this.errorCount = 0;
    }

    win(): void {
        this.uiController.informUser("КЪРТИШ! ПОБЕДА! 🥳", "green", true);
        const timeElapsed = Date.now() - (this.gameStartTimestamp ?? 0);
        const percentCorrectOnFirstTry = Math.round(100 * this.numCorrectAtFirstTry / this.promptGenerator.length);
        this.uiController.onWin(new ResultStats(this.gameType, timeElapsed, percentCorrectOnFirstTry));

        this.appController.firebaseController.onGameEnd(new ResultStats(this.gameType, timeElapsed, percentCorrectOnFirstTry));
    }

    nextQuestion(): void {
        this.currentPromptIndex++;
        this.uiController.updateProgressIndicator();
        this.uiController.showPrompt();
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
        const currentPrompt = this.getCurrentPrompt();
        if(userAnswer == currentPrompt.answer) {
            this.pointsTowardWin++;
            if(this.winConditionsMet()) {
                this.problemsCompleted++;
                this.uiController.updateProgressIndicator();
                this.win();
                return;
            }
            this.problemsCompleted++;
            this.uiController.updateProgressIndicator();

            this.uiController.informUser("✅ Точно така!", "#00c000");
            if(currentPrompt.failedAttempts == 0) {
                this.numCorrectAtFirstTry++;
            }
            if(this.currentPromptIndex == this.promptGenerator.length - 1) {
                this.currentPromptIndex++;
                this.uiController.updateProgressIndicator();
                this.win();
            } else {
                this.nextQuestion();
            }
        } else {
            this.pointsTowardWin--;
            this.uiController.updateProgressIndicator();

            this.errorCount++;
            this.uiController.updateSessionTimeIndicator();
            this.uiController.informUser("❌ Пробвай пак.", "black");
            this.uiController.showPrompt();
            currentPrompt.failedAttempts++;
        }
    }

    onUserRequestedAnswerReveal(): void {
        this.pointsTowardWin-=2;
        this.problemsCompleted++;
        this.uiController.updateProgressIndicator();

        const answer = this.getCurrentPrompt().answer;
        this.uiController.informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
        
        // push question back to the end of the queue
        this.promptGenerator.push(this.promptGenerator[this.currentPromptIndex]);
        this.promptGenerator.splice(this.currentPromptIndex, 1);

        this.errorCount++;
        this.uiController.updateSessionTimeIndicator();

        this.uiController.showPrompt();
        this.getCurrentPrompt().failedAttempts++;
    }
}
