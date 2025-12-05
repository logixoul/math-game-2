export class GameSession {
    constructor(appController, gameTypeClass) {
        this.appController = appController;
        this.uiController = appController.uiController;
        
        this.errorCount = 0;
        this.whenLastStarted = null;
        this.isFirstTry = true;
        this.gameType = new gameTypeClass();
        this.promptList = this.gameType.generatePromptList();

        this.currentPromptIndex = 0;
        this.numCorrectAtFirstTry = 0;
        this.uiController.gameSession = this;
        this.uiController.onNewSession();

        this.errorCount = 0;
        this.isFirstTry = true;
    }

    win() {
        this.uiController.informUser("КЪРТИШ! ПОБЕДА! 🥳", "green", true);
        var timeElapsed = Date.now() - this.whenLastStarted;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor(timeElapsed / 1000) % 60;
        const percentCorrectOnFirstTry = Math.round(100 * this.numCorrectAtFirstTry / this.promptList.length);
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
        if(this.currentPromptIndex == 0)
            this.whenLastStarted = Date.now();

        const currentPrompt = this.getCurrentPrompt();
        if(userAnswer == currentPrompt.answer) {
            this.uiController.informUser("✅ Точно така!", "#00c000");
            if(this.isFirstTry) {
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
            this.isFirstTry = false;
        }
    }
}
