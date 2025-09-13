import { globals } from 'Globals';
import * as util from 'util';

export class GameSession {
    constructor() {
        this.errorCount = 0;
        this.whenLastStarted = null;
        this.isFirstTry = true;
        this._initPromptList();

        this.currentPromptIndex = 0;
        this.numCorrectAtFirstTry = 0;
        globals.ui.gameSession = this;
        globals.ui.onNewSession();

        this.errorCount = 0;
        this.isFirstTry = true;
    }

    _initPromptList() {
        this.promptList = [];
        for (var a = 2; a <= 10; a++) {
            for (var b = 2; b <= 10; b++) {
                this.promptList.push({ a: a, b: b });
            }
        }
        this.promptList = util.shuffleList(this.promptList);
    }

    win() {
        globals.ui.informUser("КЪРТИШ! ПОБЕДА!", "green", true);
        var timeElapsed = Date.now() - whenLastStarted;
        const minutes = Math.floor(timeElapsed / 60000);
        const seconds = Math.floor(timeElapsed / 1000) % 60;
        const percentCorrectOnFirstTry = Math.round(100 * numCorrectAtFirstTry / promptList.length);
        globals.ui.informUser("Отне ти " + minutes + "мин " + seconds + "сек. Познал си " + percentCorrectOnFirstTry + "% от първи опит.", "black");
        globals.ui.editBox.style.display = "none";
        globals.ui.btnStartOver.style.display = "inline";
    }

    nextQuestion() {
        this.currentPromptIndex++;
        globals.ui.updateProgressIndicator();
        globals.ui.showPrompt();
        this.isFirstTry = true;
    }
}
