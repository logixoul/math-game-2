import * as PromptTypes from 'PromptTypes';
import { AppController } from 'AppController';
import { GameSession } from 'GameSession';

export class UIController {
    constructor(appController) {
        this.appController = appController;

        this.container = document.getElementById("container");
        this.btnStartOver = document.getElementById("btnStartOver");
        this.editBox = document.getElementById("userAnswerBox");
        this.btnSeeAnswer = document.getElementById("btnSeeAnswer");
        this.dropdownPromptType = document.getElementById("dropdownPromptType");

        this.btnStartOver.addEventListener("click", function() {
            btnStartOver.style.display = "none";
            this.appController.startNewGame(PromptTypes[this.dropdownPromptType.value]);
        }.bind(this));
        this.btnSeeAnswer.addEventListener("click", function() {
            const answer = this.gameSession.getCurrentPrompt().answer;
            const info = informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
            nextQuestion();
        }.bind(this));
        
        this.editBox.focus();
        this.editBox.addEventListener("keydown",
            function(event) {
                if(event.key == "Enter") {
                    this.onUserPressedEnter();
                }
            }.bind(this)
        );

        this.dropdownPromptType.addEventListener("change", function() {
            const selectedValue = this.dropdownPromptType.value;
            let promptTypeClass = null;
            if(selectedValue in PromptTypes) {
                promptTypeClass = PromptTypes[selectedValue];
            }
            if(promptTypeClass) {
                this.gameSession = new GameSession(this.appController, promptTypeClass);
            }
        }.bind(this));

        this.latestPrompt = null;
    }

    onUserPressedEnter() {
        this.latestPrompt.textContent = this.latestPrompt.textContent + this.editBox.value;
        
        const userAnswer = parseInt(this.editBox.value);
        this.gameSession.onUserAnswered(userAnswer);
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
        this.informUser(currentPrompt.text + " = ", "black");
    }
}