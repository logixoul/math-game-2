import type { AppController } from './AppController';
import type { GameType, GameTypeCtor, Prompt } from './PromptTypes';
import type { UIController } from './UI';

export class GameSession {
    appController: AppController;
    uiController: UIController;
    errorCount: number;
    whenLastStarted: number | null;
    gameType: GameType;
    promptList: Prompt[];
    currentPromptIndex: number;
    numCorrectAtFirstTry: number;

    constructor(appController: AppController, gameTypeClass: GameTypeCtor) {
        this.appController = appController;
        this.uiController = appController.uiController;
        
        this.errorCount = 0;
        this.whenLastStarted = null;
        this.gameType = new gameTypeClass();
        this.promptList = this.gameType.generatePromptList();

        this.currentPromptIndex = 0;
        this.numCorrectAtFirstTry = 0;
        this.uiController.gameSession = this;
        this.uiController.onNewSession();

        this.errorCount = 0;
    }

    win(): void {
        this.uiController.informUser("КЪРТИШ! ПОБЕДА! 🥳", "green", true);
        const timeElapsed = Date.now() - (this.whenLastStarted ?? 0);
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor(timeElapsed / 1000) % 60;
        const percentCorrectOnFirstTry = Math.round(100 * this.numCorrectAtFirstTry / this.promptList.length);
        this.uiController.informUser("Отне ти " + minutes + "мин " + seconds + "сек. Познал си " + percentCorrectOnFirstTry + "% от първи опит.", "black");
        this.uiController.userAnswerBox.style.display = "none";
        this.uiController.btnStartOver.style.display = "inline";
    }

    nextQuestion(): void {
        this.currentPromptIndex++;
        this.uiController.updateProgressIndicator();
        this.uiController.showPrompt();
    }

    getCurrentPrompt(): Prompt {
        return this.promptList[this.currentPromptIndex];
    }

    onUserAnswered(userAnswer: number): void {
        if(this.currentPromptIndex == 0)
            this.whenLastStarted = Date.now();

        const currentPrompt = this.getCurrentPrompt();
        if(userAnswer == currentPrompt.answer) {
            this.uiController.informUser("✅ Точно така!", "#00c000");
            if(currentPrompt.failedAttempts == 0) {
                this.numCorrectAtFirstTry++;
            }
            if(this.currentPromptIndex == this.promptList.length - 1) {
                this.currentPromptIndex++;
                this.uiController.updateProgressIndicator();
                this.win();
            } else {
                this.nextQuestion();
            }
        } else {
            this.errorCount++;
            this.uiController.updateErrorCountIndicator();
            this.uiController.informUser("❌ Пробвай пак.", "black");
            this.uiController.showPrompt();
            currentPrompt.failedAttempts++;
        }
    }

    onUserRequestedAnswerReveal(): void {
        const answer = this.getCurrentPrompt().answer;
        this.uiController.informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
        
        // push question back to the end of the queue
        this.promptList.push(this.promptList[this.currentPromptIndex]);
        this.promptList.splice(this.currentPromptIndex, 1);

        this.errorCount++;
        this.uiController.updateErrorCountIndicator();

        this.uiController.showPrompt();
        this.getCurrentPrompt().failedAttempts++;
    }
}
