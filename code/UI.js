import * as PromptTypes from './PromptTypes.js';
//import { AppController } from 'AppController';
//import { GameSession } from 'GameSession';

export class UIController {
    constructor(appController) {
        this.appController = appController;

        this.logElement = document.getElementById("log");
        this.logContainer = document.getElementById("logContainer");
        this.bottomPane = document.getElementById("bottomPane");

        this.btnStartOver = document.getElementById("btnStartOver");
        this.userAnswerBox = document.getElementById("userAnswerBox");

        this.btnSeeAnswer = document.getElementById("btnSeeAnswer");
        this.dropdownPromptType = document.getElementById("dropdownPromptType");
        this.indicators = document.getElementById("indicators");
        this.mainForm = document.getElementById("mainForm");
        this.keypad = document.getElementById("keypad");
        this.btnMenu = document.getElementById("btnMenu");
        this.menuContents = document.getElementById("menuContents");

        this.btnStartOver.addEventListener("click", function() {
            this.btnStartOver.style.display = "none";
            this.appController.startNewGame(PromptTypes[this.dropdownPromptType.value]);
            this.userAnswerBox.focus();
        }.bind(this));
        this.btnSeeAnswer.addEventListener("click", function() {
            this.gameSession.onUserRequestedAnswerReveal();
        }.bind(this));
        
        this.userAnswerBox.focus();
        
        this.mainForm.addEventListener("submit", function(e) {
            e.preventDefault();
            this.onUserPressedEnter();
            /*window.setTimeout(0, function() {
                this.userAnswerBox.focus(); // don't let the softkeyboard disappear
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
                this.appController.startNewGame(promptTypeClass);
            }
        }.bind(this));

        this.btnMenu.addEventListener("click", function() {
            if(this.menuContents.style.display === "block") {
                this.menuContents.style.display = "none";
            } else {
                this.menuContents.style.display = "block";
            }
        }.bind(this));

        this.latestPrompt = null;

        this.relocateIndicators();
        if (window.visualViewport) {
            window.visualViewport.addEventListener('scroll', this.relocateIndicators.bind(this));
            window.visualViewport.addEventListener('resize', this.relocateIndicators.bind(this));
        } else {
            window.addEventListener('scroll', this.relocateIndicators.bind(this));
            window.addEventListener('resize', this.relocateIndicators.bind(this));
        }

        this.buildKeypad();
        this.initGameTypesInDropdown();

        this.adjustMiddlePanePadding();
        window.addEventListener('resize', this.adjustMiddlePanePadding.bind(this));
        window.addEventListener('orientationchange', this.adjustMiddlePanePadding.bind(this));
    }

    initGameTypesInDropdown() {
        const gameTypes = this.appController.getAvailableGameTypes();
        this.dropdownPromptType.innerHTML = "";
        gameTypes.forEach(gameTypeClass => {
            const option = document.createElement("option");
            const gameTypeInstance = new gameTypeClass();
            console.log(gameTypeClass, gameTypeClass.name);
            option.value = gameTypeClass.name;
            option.textContent = gameTypeInstance.localizedName;
            this.dropdownPromptType.appendChild(option);
        });
    }

    arrowInlineSvg = `<svg fill="#000000" height="20px" width="20px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">
<polygon points="437.3,30 202.7,339.3 64,200.7 0,264.7 213.3,478 512,94 "/>
</svg>`
    backspaceInlineSvg = `

<svg height="20px" width="20px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 512 512"  xml:space="preserve">
<style type="text/css">
	.st0{fill:#000000;}
</style>
<g>
	<path class="st0" d="M459.279,63.989H193.251c-20.346,0-39.7,8.82-53.054,24.186L4.314,244.473c-5.752,6.61-5.752,16.443,0,23.06
		l135.883,156.306c13.354,15.359,32.708,24.172,53.054,24.172h266.028c29.116,0,52.721-23.605,52.721-52.721V116.716
		C512,87.593,488.395,63.989,459.279,63.989z M360.581,338.701l-51.687-51.672l-51.672,51.658l-31.03-31.015l51.673-51.687
		L226.2,204.32l31.022-31.022l51.672,51.673l51.679-51.687l31.022,31.036l-51.687,51.679l51.701,51.673L360.581,338.701z"/>
</g>
</svg>`

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
        this.setupKeypadButton(btnArray, 3, 2, this.backspaceInlineSvg, function() {
            //this.userAnswerBox.value = this.userAnswerBox.value.slice(0, -1);
            this.latestAnswerField.textContent = this.latestAnswerField.textContent.slice(0, -1);
        }.bind(this));
        const btnOk = this.setupKeypadButton(btnArray, 3, 3, this.arrowInlineSvg, function() {
            this.onUserPressedEnter();
        }.bind(this));

        btnOk.classList.add("keypadButtonOk");
    }

    setupKeypadButton(btnArray, col, row, text, onClick) {
        const btn = btnArray[col][row];
        //btn.textContent = text;
        btn.innerHTML = text;
        if(!onClick)
            onClick = function() {
                    this.latestAnswerField.append(text);
                }.bind(this);
        btn.addEventListener("click", onClick);
        return btn;
    }

    relocateIndicators() {
        // hack: unbreak on mobile when soft keyboard is open. Would normally just use `position: fixed`
        const offsetTop = (window.visualViewport && typeof window.visualViewport.offsetTop === 'number')
            ? window.visualViewport.offsetTop
            : 0;
        this.indicators.style.top = (5 + offsetTop) + 'px';
    }

    onUserPressedEnter() {
        this.latestPrompt.textContent = this.latestPrompt.textContent + this.userAnswerBox.value;
        
        const userAnswer = parseInt(this.userAnswerBox.value);
        this.gameSession.onUserAnswered(userAnswer);
        this.userAnswerBox.value = "";
    }

    onNewSession() {
        this.logElement.textContent = "";
        this.userAnswerBox.style.display = "block";
        this.updateProgressIndicator();
        this.updateErrorCountIndicator();
        this.showPrompt();

    }
    updateProgressIndicator() {
        const progressIndicator = document.getElementById("progressIndicator");
        progressIndicator.textContent = "Прогрес: " + this.gameSession.currentPromptIndex + '/' + this.gameSession.promptList.length;
    }
    updateErrorCountIndicator() {
        const progressIndicator = document.getElementById("errorCountIndicator");
        progressIndicator.textContent = "Грешки: " + this.gameSession.errorCount;
    }
    // from GPT
    /*
    scrollToBottom(padding = 8) {
        const el = this.btnSeeAnswer;
        if (!el) return;

        const vv = window.visualViewport;
        const rect = el.getBoundingClientRect();
        const viewportHeight = vv ? vv.height : window.innerHeight;

        // how many pixels the element's bottom extends past the visible viewport
        const over = rect.bottom - viewportHeight + padding;

        if (over > 0) {
            // scroll by the amount necessary so the element sits above the overlay (add small extra)
            // (needed because on iPhone we have a bottom toolbar which makes it
            // insufficient to simply call scrollIntoView)
            window.scrollBy({ top: over + 16, behavior: 'smooth' });
        } else {
            // fallback: center the element to avoid being under toolbars
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }*/
    scrollToBottom() {
        this.logContainer.scrollTo({
            top: this.logContainer.scrollHeight,
            left: 0,
            behavior: 'smooth'
        });
    }
    adjustMiddlePanePadding() {
        this.logContainer.style.paddingBottom = `${this.bottomPane.offsetHeight}px`;
    }
    informUser(message, color, isBold) {
        const newMessageElement = document.createElement("p");
        newMessageElement.textContent = message;
        newMessageElement.style.color = color;
        if(isBold)
            newMessageElement.style.fontWeight = "bold";
        this.latestPrompt = newMessageElement;
        this.logElement.append(newMessageElement);
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