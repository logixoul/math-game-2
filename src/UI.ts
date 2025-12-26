import * as PromptTypes from './GameTypes';
import { QuickDebugLogger } from './QuickDebugLogger';
import type { AppController } from './AppController';
import type { GameTypeCtor } from './GameTypes';
import type { GameSession } from './GameSession';
import { ResultStats } from './ResultStats';

export class UIController {
    private gameSession!: GameSession;
    private log: HTMLElement = document.getElementById("log") as HTMLElement;
    private middlePane: HTMLElement = document.getElementById("middlePane") as HTMLElement;
    private keypadAndIndicators: HTMLElement = document.getElementById("keypadAndIndicators") as HTMLElement;
    private btnStartOver: HTMLButtonElement = document.getElementById("btnStartOver") as HTMLButtonElement;
    private userAnswerBox: HTMLInputElement = document.getElementById("userAnswerBox") as HTMLInputElement;
    private dropdownPromptType: HTMLSelectElement = document.getElementById("dropdownPromptType") as HTMLSelectElement;
    private indicators: HTMLElement = document.getElementById("indicators") as HTMLElement;
    private keypad: HTMLElement = document.getElementById("keypad") as HTMLElement;
    private btnMenu: HTMLButtonElement = document.getElementById("btnMenu") as HTMLButtonElement;
    private header: HTMLElement = document.getElementById("header") as HTMLElement;
    private menuContents: HTMLElement = document.getElementById("menuContents") as HTMLElement;
    private loginBtn: HTMLButtonElement = document.getElementById("loginBtn") as HTMLButtonElement;
    private userInfo: HTMLElement = document.getElementById("userInfo") as HTMLElement;
    private logoutBtn: HTMLButtonElement = document.getElementById("logoutBtn") as HTMLButtonElement;
    private btnStartGame: HTMLButtonElement = document.getElementById("btnStartGame") as HTMLButtonElement;
    private latestAnswerField!: HTMLSpanElement;

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
        this.btnStartGame.addEventListener("click", () => {
            window.location.hash = "#game";
            this.userAnswerBox.focus();
        });
        
        this.userAnswerBox.focus();
        
        this.userAnswerBox.addEventListener("keydown", (e: KeyboardEvent) => {
            if(e.key === "Enter") {
                this.onUserPressedEnter();
            }
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
            if(this.menuContents.style.display === "flex") {
                this.menuContents.style.display = "none";
            } else {
                this.menuContents.style.display = "flex";
            }
        });

        this.loginBtn.addEventListener("click", () => {
            this.appController.firebaseController.login();
        });

        this.logoutBtn.addEventListener("click", () => {
            this.appController.firebaseController.logout();
        });

        this.appController.firebaseController.bus.on("loggedIn", ({ user }) => {
                this.userInfo.innerText = "Здравей, " + user.email;
                this.loginBtn.style.display = "none";
                this.logoutBtn.style.display = "inline";
        });
        this.appController.firebaseController.bus.on("loggedOut", () => {
                this.userInfo.innerText = "Не си влязъл в системата";
                this.loginBtn.style.display = "inline";
                this.logoutBtn.style.display = "none";
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
        if ("fonts" in document && document.fonts) {
            document.fonts.ready.then(() => {
                this.adjustMiddlePanePadding();
            });
        }
        if ("ResizeObserver" in window) {
            const headerResizeObserver = new ResizeObserver(() => {
                this.adjustMiddlePanePadding();
            });
            headerResizeObserver.observe(this.header);
        }
        window.addEventListener('resize', this.adjustMiddlePanePadding.bind(this));
        window.addEventListener('orientationchange', this.adjustMiddlePanePadding.bind(this));

        if(this.#isMobileDevice()) {
            this.keypad.style.display = "grid";
            this.userAnswerBox.style.display = "none";
        } else {
            this.keypad.style.display = "none";
            this.userAnswerBox.style.display = "block";
        }

        window.setInterval(() => {
            this.updateSessionTimeIndicator();
        }, 1000);
    }

    onWin(resultStats: ResultStats): void {
        const minutes = Math.floor(resultStats.timeElapsedMs / 60000);
        const seconds = Math.floor(resultStats.timeElapsedMs / 1000) % 60;
        
        this.informUser("Отне ти " + minutes + "мин " + seconds + "сек. Познал си " + resultStats.percentCorrectOnFirstTry + "% от първи опит.", "black");
        this.userAnswerBox.style.display = "none";
        this.btnStartOver.style.display = "inline";
        
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
        const btnRequestReveal = this.#setupKeypadButton(btnArray, 3, 1, "Не знам", () => {
            this.gameSession.onUserRequestedAnswerReveal();
        });
        this.#setupKeypadButton(btnArray, 0, 2, "7");
        this.#setupKeypadButton(btnArray, 1, 2, "8");
        this.#setupKeypadButton(btnArray, 2, 2, "9");
        this.#setupKeypadButton(btnArray, 1, 3, "0");
        this.#setupKeypadButton(btnArray, 3, 2, "<img src='assets/backspace.svg'>", () => {
            //this.userAnswerBox.value = this.userAnswerBox.value.slice(0, -1);
            const currentText = this.latestAnswerField.textContent ?? "";
            this.latestAnswerField.textContent = currentText.slice(0, -1);
        });
        const btnOk = this.#setupKeypadButton(btnArray, 3, 3, "<img src='assets/enter.svg'>", () => {
            this.onUserPressedEnter();
        });

        btnOk.classList.add("keypadButtonOk");
        btnRequestReveal.classList.add("keypadButtonRequestReveal")
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

    // todo: am I even still using this? 
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
        this.updateSessionTimeIndicator();
        this.showPrompt();

    }
    private ensureTextContainsSign(n: number): string {
        return (n >= 0 ? "+" : "") + n.toString();
    }
    updateProgressIndicator(): void {
        const progressIndicator = document.getElementById("progressIndicator") as HTMLElement;
        progressIndicator.innerHTML = "<b>Точки: " +
            this.ensureTextContainsSign(this.gameSession.pointsTowardWin) +
            '</b>.<br>За победа ти трябват още ' +
            (this.gameSession.pointsRequiredToWin - this.gameSession.pointsTowardWin) +
            " точки и " + (this.gameSession.minproblemsCompletedToWin - this.gameSession.problemsCompleted) + " пробвани задачи";
    }
    updateSessionTimeIndicator(): void {
        const progressIndicator = document.getElementById("sessionTimeIndicator") as HTMLElement;
        const minutesLeft = Math.floor((this.gameSession.maxSessionDurationMs - (Date.now() - this.gameSession.gameStartTimestamp)) / 60000);
        progressIndicator.textContent = "Имаш още " + minutesLeft + " минути";
    }
    scrollToBottom(): void {
        this.middlePane.scrollTo({
            top: this.middlePane.scrollHeight,
            left: 0,
            behavior: 'smooth'
        });
    }
    adjustMiddlePanePadding(): void {
        document.documentElement.style.setProperty("--header-width", `${this.header.offsetWidth}px`);
        document.documentElement.style.setProperty("--header-height", `${this.header.offsetHeight}px`);
    }
    informUser(message: string, color: string, isBold?: boolean): HTMLElement {
        const newMessageElement = document.createElement("p");
        newMessageElement.textContent = message;
        newMessageElement.style.color = color;
        if(isBold)
            newMessageElement.style.fontWeight = "bold";
        this.log.append(newMessageElement);
        this.scrollToBottom();

        const answerField = document.createElement("span");
        newMessageElement.append(answerField);
        this.latestAnswerField = answerField;

        return newMessageElement;
    }
    showPrompt(): void {
        this.informUser(this.gameSession.currentPrompt.text + " = ", "black");
    }
}
