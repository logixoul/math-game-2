import { globals } from './Globals.js';

export class UI {
    gameSession = null;

    constructor() {
        this.container = document.getElementById("container");
        this.btnStartOver = document.getElementById("btnStartOver");
        this.editBox = document.getElementById("userAnswerBox");
        this.btnSeeAnswer = document.getElementById("btnSeeAnswer");

        this.btnStartOver.addEventListener("click", function() {
            btnStartOver.style.display = "none";
            globals.gameSession = new GameSession();
        });
        this.btnSeeAnswer.addEventListener("click", function() {
            const currentPrompt = promptList[currentPromptIndex];
            const answer = currentPrompt.a * currentPrompt.b;
            const info = informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
            nextQuestion();
        });
        
        this.editBox.focus();
        this.editBox.addEventListener("keydown",
            function(event) {
                if(event.key == "Enter") {
                    this.onUserPressedEnter();
                }
            }.bind(this)
        );
        this.latestPrompt = null;
    }

    onUserPressedEnter() {
        if(globals.currentPromptIndex == 0)
            whenLastStarted = Date.now();
        this.latestPrompt.textContent = this.latestPrompt.textContent + this.editBox.value;
        
        const currentPrompt = this.gameSession.promptList[this.gameSession.currentPromptIndex];
        if(parseInt(this.editBox.value) == currentPrompt.a * currentPrompt.b) {
            this.informUser("Точно така!", "green");
            if(this.gameSession.isFirstTry) {
                this.gameSession.numCorrectAtFirstTry++;
            }
            if(this.gameSession.currentPromptIndex == this.gameSession.promptList.length - 1) {
                win();
            } else {
                this.gameSession.nextQuestion();
            }
        } else {
            this.gameSession.errorCount++;
            this.updateErrorCountIndicator();
            this.informUser("Пробвай пак.", "black");
            this.showPrompt();
            this.gameSession.isFirstTry = false;
        }
        this.editBox.value = "";
    }

    onNewSession() {
        this.container.textContent = "";
        this.editBox.style.display = "inline";
        this.updateProgressIndicator();
        this.updateErrorCountIndicator();
        this.showPrompt();

    }
    updateProgressIndicator() {
        const progressIndicator = document.getElementById("progressIndicator");
        progressIndicator.textContent = Math.floor(100* this.gameSession.currentPromptIndex / this.gameSession.promptList.length) + "% минати";
    }
    updateErrorCountIndicator() {
        const progressIndicator = document.getElementById("errorCountIndicator");
        progressIndicator.textContent = this.gameSession.errorCount + " грешки";
    }
    scrollToBottom() {
        this.btnSeeAnswer.scrollIntoView({behavior: "smooth", block: "end" });
    }
    informUser(message, color, isBold) {
        const newElement = document.createElement("p");
        newElement.textContent = message;
        newElement.style.color = color;
        if(isBold)
            newElement.style.fontWeight = "bold";
        this.latestPrompt = newElement;
        this.container.append(newElement);
        this.scrollToBottom();
        return this.latestPrompt;
    }
    showPrompt() {
        const currentPrompt = this.gameSession.promptList[this.gameSession.currentPromptIndex];
        this.informUser(currentPrompt.a+"×"+currentPrompt.b+" = ", "black");
    }
}