import * as PromptTypes from './PromptTypes.js';
import { QuickDebugLogger } from './QuickDebugLogger.js';
import { inlineJsAssets } from './InlineJsAssets.js';

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

        this.#buildKeypad();
        this.#initGameTypesInDropdown();

        this.adjustMiddlePanePadding();
        window.addEventListener('resize', this.adjustMiddlePanePadding.bind(this));
        window.addEventListener('orientationchange', this.adjustMiddlePanePadding.bind(this));

        if(this.#isMobileDevice()) {
            this.keypad.style.display = "grid";
            this.userAnswerBox.style.display = "none";
        } else {
            this.keypad.style.display = "none";
            this.userAnswerBox.style.display = "block";
        }
    }

    #isMobileDevice() {
        return window.matchMedia("(pointer: coarse), (hover: none), (any-pointer: coarse)").matches;
    }

    #initGameTypesInDropdown() {
        const gameTypes = this.appController.getAvailableGameTypes();
        this.dropdownPromptType.innerHTML = "";
        gameTypes.forEach(gameTypeClass => {
            const option = document.createElement("option");
            const gameTypeInstance = new gameTypeClass();
            
            option.value = gameTypeClass.name;
            option.textContent = gameTypeInstance.localizedName;
            this.dropdownPromptType.appendChild(option);
        });
    }

    #buildKeypad() {
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

        this.#setupKeypadButton(btnArray, 0, 0, "1");
        this.#setupKeypadButton(btnArray, 1, 0, "2");
        this.#setupKeypadButton(btnArray, 2, 0, "3");
        this.#setupKeypadButton(btnArray, 0, 1, "4");
        this.#setupKeypadButton(btnArray, 1, 1, "5");
        this.#setupKeypadButton(btnArray, 2, 1, "6");
        this.#setupKeypadButton(btnArray, 0, 2, "7");
        this.#setupKeypadButton(btnArray, 1, 2, "8");
        this.#setupKeypadButton(btnArray, 2, 2, "9");
        this.#setupKeypadButton(btnArray, 1, 3, "0");
        this.#setupKeypadButton(btnArray, 3, 2, inlineJsAssets.backspace, function() {
            //this.userAnswerBox.value = this.userAnswerBox.value.slice(0, -1);
            this.latestAnswerField.textContent = this.latestAnswerField.textContent.slice(0, -1);
        }.bind(this));
        const btnOk = this.#setupKeypadButton(btnArray, 3, 3, inlineJsAssets.arrow, function() {
            this.onUserPressedEnter();
        }.bind(this));

        btnOk.classList.add("keypadButtonOk");
    }

    #setupKeypadButton(btnArray, col, row, text, onClick) {
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

    _getUserAnswerText() {
        if(this.#isMobileDevice()) {
            return this.latestAnswerField.textContent;
        } else {
            return this.userAnswerBox.value;
        }
    }

    onUserPressedEnter() {
        let userAnswerText = this._getUserAnswerText();
        if(!this.#isMobileDevice()) {
            this.latestAnswerField.textContent = userAnswerText;
        }
        
        const userAnswer = parseInt(userAnswerText);
        this.gameSession.onUserAnswered(userAnswer);
        this.userAnswerBox.value = "";
    }

    onNewSession() {
        this.logElement.textContent = "";
        if(!this.#isMobileDevice()) {
            this.userAnswerBox.style.display = "block";
        }
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