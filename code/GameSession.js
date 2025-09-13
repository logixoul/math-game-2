import * as util from 'util';
import { MultiplicationPrompt, DivisionPrompt } from 'PromptTypes';

export class GameSession {
    constructor(appController, promptType) {
        this.appController = appController;
        this.uiController = appController.uiController;
        
        this.promptType = promptType;
        this.errorCount = 0;
        this.whenLastStarted = null;
        this.isFirstTry = true;
        this._initPromptList();

        this.currentPromptIndex = 0;
        this.numCorrectAtFirstTry = 0;
        this.uiController.gameSession = this;
        this.uiController.onNewSession();

        this.errorCount = 0;
        this.isFirstTry = true;
    }

    _initPromptList() {
        if(this.promptType == MultiplicationPrompt) {
            this._initMultiplicationPromptList();
        } else if (this.promptType == DivisionPrompt) {
            this._initDivisionPromptList();
        }
    }

    _initMultiplicationPromptList() {
        this.promptList = [];
        for (var a = 0; a <= 10; a++) {
            for (var b = 0; b <= 10; b++) {
                this.promptList.push(new MultiplicationPrompt(a, b));
            }
        }
        this.promptList = util.shuffleList(this.promptList);
    }

    _initDivisionPromptList() {
        this.promptList = [];  
        for (var b = 1; b <= 10; b++) {
            for (var a = 0; a <= 10; a++) {
                this.promptList.push(new DivisionPrompt(a * b, b));
            }
        }
        this.promptList = util.shuffleList(this.promptList);
    }

    win() {
        this.uiController.informUser("КЪРТИШ! ПОБЕДА!", "green", true);
        var timeElapsed = Date.now() - whenLastStarted;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor(timeElapsed / 1000) % 60;
        const percentCorrectOnFirstTry = Math.round(100 * numCorrectAtFirstTry / promptList.length);
        this.uiController.informUser("Отне ти " + minutes + "мин " + seconds + "сек. Познал си " + percentCorrectOnFirstTry + "% от първи опит.", "black");
        this.uiController.editBox.style.display = "none";
        this.uiController.btnStartOver.style.display = "inline";
    }

    nextQuestion() {
        this.currentPromptIndex++;
        this.uiController.updateProgressIndicator();
        this.uiController.showPrompt();
        this.isFirstTry = true;
    }

    getCurrentPrompt() {
        return this.promptList[this.currentPromptIndex];
    }

    onUserAnswered(userAnswer) {
        const currentPrompt = this.getCurrentPrompt();
        if(userAnswer == currentPrompt.answer) {
            this.uiController.informUser("✅ Точно така!", "#00c000");
            if(this.isFirstTry) {
                this.numCorrectAtFirstTry++;
            }
            if(this.currentPromptIndex == this.promptList.length - 1) {
                this.win();
            } else {
                this.nextQuestion();
            }
        } else {
            this.errorCount++;
            this.uiController.updateErrorCountIndicator();
            this.uiController.informUser("❌ Пробвай пак.", "black");
            this.uiController.showPrompt();
            this.isFirstTry = false;
        }
    }
}
