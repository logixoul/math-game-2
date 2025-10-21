import * as PromptTypes from 'PromptTypes';
import { AppController } from 'AppController';
import { GameSession } from 'GameSession';

export class UIController {
    constructor(appController) {
        this.appController = appController;

        this.container = document.getElementById("container");
        this.btnStartOver = document.getElementById("btnStartOver");
        //this.editBox = document.getElementById("userAnswerBox");
        this.btnSeeAnswer = document.getElementById("btnSeeAnswer");
        this.dropdownPromptType = document.getElementById("dropdownPromptType");
        this.indicators = document.getElementById("indicators");
        this.mainForm = document.getElementById("mainForm");
        this.keypad = document.getElementById("keypad");

        this.btnStartOver.addEventListener("click", function() {
            this.btnStartOver.style.display = "none";
            this.appController.startNewGame(PromptTypes[this.dropdownPromptType.value]);
        }.bind(this));
        this.btnSeeAnswer.addEventListener("click", function() {
            const answer = this.gameSession.getCurrentPrompt().answer;
            this.informUser("Отговорът е "+answer+". Запомнѝ го! 😇", "red");
            this.gameSession.nextQuestion();
            this.gameSession.errorCount++;
            this.updateErrorCountIndicator();
        }.bind(this));
        
        //this.editBox.focus();
        
        this.mainForm.addEventListener("submit", function(e) {
            e.preventDefault();
            this.onUserPressedEnter();
            /*window.setTimeout(0, function() {
                this.editBox.focus(); // don't let the softkeyboard disappear
            }.bind(this));*/
            return false;
        }.bind(this));

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

        this.relocateIndicators();
        window.visualViewport.addEventListener('scroll', this.relocateIndicators.bind(this));
        window.visualViewport.addEventListener('resize', this.relocateIndicators.bind(this));

        this.buildKeypad();
    }

    buildKeypad() {
        const btnArray = new Array();
        for(let col = 0; col < 4; col++) {
            btnArray.push(new Array(4));
        }
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 4; col++) {
                const btn = document.createElement("div");
                btn.classList.add('keypadButton');
                
                this.keypad.appendChild(btn);

                btnArray[col][row] = btn;
            }
        }

        this.setupKeypadButton(btnArray, 0, 0, "1");
        this.setupKeypadButton(btnArray, 1, 0, "2");
        this.setupKeypadButton(btnArray, 2, 0, "3");
        this.setupKeypadButton(btnArray, 0, 1, "4");
        this.setupKeypadButton(btnArray, 1, 1, "5");
        this.setupKeypadButton(btnArray, 2, 1, "6");
        this.setupKeypadButton(btnArray, 0, 2, "7");
        this.setupKeypadButton(btnArray, 1, 2, "8");
        this.setupKeypadButton(btnArray, 2, 2, "9");
        this.setupKeypadButton(btnArray, 1, 3, "0");
        this.setupKeypadButton(btnArray, 3, 2, "⌫", function() {
            //this.editBox.value = this.editBox.value.slice(0, -1);
            this.latestAnswerField.textContent = this.latestAnswerField.textContent.slice(0, -1);
        }.bind(this));
        this.setupKeypadButton(btnArray, 3, 3, "OK", function() {
            this.onUserPressedEnter();
        }.bind(this));
    }

    setupKeypadButton(btnArray, col, row, text, onClick) {
        const btn = btnArray[col][row];
        btn.textContent = text;
        if(!onClick)
            onClick = function() {
                    this.latestAnswerField.append(text);
                }.bind(this);
        btn.addEventListener("click", onClick);
    }

    relocateIndicators() {
        // hack: unbreak on mobile when soft keyboard is open. Would normally just use `position: fixed`
        this.indicators.style.top = (5 + window.visualViewport.offsetTop) + 'px';
    }

    onUserPressedEnter() {
        //this.latestPrompt.textContent = this.latestPrompt.textContent + this.editBox.value;
        
        const userAnswer = parseInt(this.latestAnswerField.textContent);
        this.gameSession.onUserAnswered(userAnswer);
        //this.editBox.value = "";
    }

    onNewSession() {
        this.container.textContent = "";
        //this.editBox.style.display = "inline";
        this.updateProgressIndicator();
        this.updateErrorCountIndicator();
        this.showPrompt();

    }
    updateProgressIndicator() {
        const progressIndicator = document.getElementById("progressIndicator");
        progressIndicator.textContent = "Прогрес: " + Math.floor(100* this.gameSession.currentPromptIndex / this.gameSession.promptList.length) + "%";
    }
    updateErrorCountIndicator() {
        const progressIndicator = document.getElementById("errorCountIndicator");
        progressIndicator.textContent = "Не знаеш: " + this.gameSession.errorCount;
    }
    scrollToBottom() {
        this.btnSeeAnswer.scrollIntoView({behavior: "smooth", block: "end" });
    }
    informUser(message, color, isBold) {
        const newMessageElement = document.createElement("p");
        newMessageElement.textContent = message;
        newMessageElement.style.color = color;
        if(isBold)
            newMessageElement.style.fontWeight = "bold";
        this.latestPrompt = newMessageElement;
        this.container.append(newMessageElement);
        this.scrollToBottom();

        const answerField = document.createElement("span");
        newMessageElement.append(answerField);
        this.latestAnswerField = answerField;

        return this.latestPrompt;
    }
    showPrompt() {
        const currentPrompt = this.gameSession.promptList[this.gameSession.currentPromptIndex];
        this.informUser(currentPrompt.text + " = ", "black");
    }
}