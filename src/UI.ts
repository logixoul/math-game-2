import * as PromptTypes from './PromptTypes';
import { QuickDebugLogger } from './QuickDebugLogger';
import { inlineJsAssets } from './InlineJsAssets';
import type { AppController } from './AppController';
import type { GameTypeCtor } from './PromptTypes';
import type { GameSession } from './GameSession';

export class UIController {
    gameSession!: GameSession;
    log: HTMLElement = document.getElementById("log") as HTMLElement;
    logContainer: HTMLElement = document.getElementById("logContainer") as HTMLElement;
    bottomPane: HTMLElement = document.getElementById("bottomPane") as HTMLElement;
    btnStartOver: HTMLButtonElement = document.getElementById("btnStartOver") as HTMLButtonElement;
    userAnswerBox: HTMLInputElement = document.getElementById("userAnswerBox") as HTMLInputElement;
    btnSeeAnswer: HTMLButtonElement = document.getElementById("btnSeeAnswer") as HTMLButtonElement;
    dropdownPromptType: HTMLSelectElement = document.getElementById("dropdownPromptType") as HTMLSelectElement;
    indicators: HTMLElement = document.getElementById("indicators") as HTMLElement;
    mainForm: HTMLFormElement = document.getElementById("mainForm") as HTMLFormElement;
    keypad: HTMLElement = document.getElementById("keypad") as HTMLElement;
    btnMenu: HTMLButtonElement = document.getElementById("btnMenu") as HTMLButtonElement;
    menuContents: HTMLElement = document.getElementById("menuContents") as HTMLElement;
    loginBtn: HTMLButtonElement = document.getElementById("loginBtn") as HTMLButtonElement;
    userInfo: HTMLElement = document.getElementById("userInfo") as HTMLElement;
    logoutBtn: HTMLButtonElement = document.getElementById("logoutBtn") as HTMLButtonElement;
    saveScoreBtn: HTMLButtonElement = document.getElementById("saveScoreBtn") as HTMLButtonElement;
    latestPrompt: HTMLElement | null = null;
    latestAnswerField!: HTMLSpanElement;

    constructor(public appController: AppController) {
        this.btnStartOver.addEventListener("click", () => {
            this.btnStartOver.style.display = "none";
            const selectedValue = this.dropdownPromptType.value as keyof typeof PromptTypes;
            const promptTypeClass = PromptTypes[selectedValue];
            if (promptTypeClass) {
                this.appController.startNewGame(promptTypeClass as GameTypeCtor);
            }
            this.userAnswerBox.focus();
        });
        this.btnSeeAnswer.addEventListener("click", () => {
            this.gameSession.onUserRequestedAnswerReveal();
        });
        
        this.userAnswerBox.focus();
        
        this.mainForm.addEventListener("submit", (e: Event) => {
            e.preventDefault();
            this.onUserPressedEnter();
            return false;
        });

        this.dropdownPromptType.addEventListener("change", () => {
            const selectedValue = this.dropdownPromptType.value as keyof typeof PromptTypes;
            const promptTypeClass = PromptTypes[selectedValue];
            if(promptTypeClass) {
                this.appController.startNewGame(promptTypeClass as GameTypeCtor);
            }
        });

        this.btnMenu.addEventListener("click", () => {
            if(this.menuContents.style.display === "block") {
                this.menuContents.style.display = "none";
            } else {
                this.menuContents.style.display = "block";
            }
        });

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

    #isMobileDevice(): boolean {
        return window.matchMedia("(pointer: coarse), (hover: none), (any-pointer: coarse)").matches;
    }

    #initGameTypesInDropdown(): void {
        const gameTypes = this.appController.getAvailableGameTypes();
        this.dropdownPromptType.innerHTML = "";
        gameTypes.forEach((gameTypeClass: GameTypeCtor) => {
            const option = document.createElement("option");
            const gameTypeInstance = new gameTypeClass();
            
            option.value = gameTypeClass.name;
            option.textContent = gameTypeInstance.localizedName;
            this.dropdownPromptType.appendChild(option);
        });
    }

    #buildKeypad(): void {
        const btnArray: HTMLDivElement[][] = [];
        for(let col = 0; col < 4; col++) {
            btnArray.push(new Array<HTMLDivElement>(4));
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
        this.#setupKeypadButton(btnArray, 3, 2, inlineJsAssets.backspace, () => {
            //this.userAnswerBox.value = this.userAnswerBox.value.slice(0, -1);
            const currentText = this.latestAnswerField.textContent ?? "";
            this.latestAnswerField.textContent = currentText.slice(0, -1);
        });
        const btnOk = this.#setupKeypadButton(btnArray, 3, 3, inlineJsAssets.arrow, () => {
            this.onUserPressedEnter();
        });

        btnOk.classList.add("keypadButtonOk");
    }

    #setupKeypadButton(btnArray: HTMLDivElement[][], col: number, row: number, text: string, onClick?: () => void): HTMLDivElement {
        const btn = btnArray[col][row];
        //btn.textContent = text;
        btn.innerHTML = text;
        if(!onClick)
            onClick = () => {
                    this.latestAnswerField.append(text);
                };
        btn.addEventListener("click", onClick);
        return btn;
    }

    relocateIndicators(): void {
        // hack: unbreak on mobile when soft keyboard is open. Would normally just use `position: fixed`
        const offsetTop = (window.visualViewport && typeof window.visualViewport.offsetTop === 'number')
            ? window.visualViewport.offsetTop
            : 0;
        this.indicators.style.top = (5 + offsetTop) + 'px';
    }

    _getUserAnswerText(): string {
        if(this.#isMobileDevice()) {
            return this.latestAnswerField.textContent ?? "";
        } else {
            return this.userAnswerBox.value;
        }
    }

    onUserPressedEnter(): void {
        let userAnswerText = this._getUserAnswerText();
        if(!this.#isMobileDevice()) {
            this.latestAnswerField.textContent = userAnswerText;
        }
        
        const userAnswer = parseInt(userAnswerText);
        this.gameSession.onUserAnswered(userAnswer);
        this.userAnswerBox.value = "";
    }

    onNewSession(): void {
        this.log.textContent = "";
        if(!this.#isMobileDevice()) {
            this.userAnswerBox.style.display = "block";
        }
        this.updateProgressIndicator();
        this.updateErrorCountIndicator();
        this.showPrompt();

    }
    updateProgressIndicator(): void {
        const progressIndicator = document.getElementById("progressIndicator") as HTMLElement;
        progressIndicator.textContent = "Прогрес: " + this.gameSession.currentPromptIndex + '/' + this.gameSession.promptList.length;
    }
    updateErrorCountIndicator(): void {
        const progressIndicator = document.getElementById("errorCountIndicator") as HTMLElement;
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
    scrollToBottom(): void {
        this.logContainer.scrollTo({
            top: this.logContainer.scrollHeight,
            left: 0,
            behavior: 'smooth'
        });
    }
    adjustMiddlePanePadding(): void {
        //this.logContainer.style.paddingBottom = `${this.bottomPane.offsetHeight}px`;
    }
    informUser(message: string, color: string, isBold?: boolean): HTMLElement {
        const newMessageElement = document.createElement("p");
        newMessageElement.textContent = message;
        newMessageElement.style.color = color;
        if(isBold)
            newMessageElement.style.fontWeight = "bold";
        this.latestPrompt = newMessageElement;
        this.log.append(newMessageElement);
        this.scrollToBottom();

        const answerField = document.createElement("span");
        newMessageElement.append(answerField);
        this.latestAnswerField = answerField;

        return newMessageElement;
    }
    showPrompt(): void {
        const currentPrompt = this.gameSession.promptList[this.gameSession.currentPromptIndex];
        this.informUser(currentPrompt.text + " = ", "black");
    }
}
