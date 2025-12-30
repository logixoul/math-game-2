import * as PageRouter from "../PageRouter"
import { GameSession } from "../GameSession";
import { AppController } from "../AppController";
import { ResultStats } from "../ResultStats";
import * as util from "../util"
import * as GameTypes from "../GameTypes"

export class GameSessionPage extends PageRouter.Page {
    private gameSession : GameSession;
    private inActiveSession  = true;
    private timerId : number;
    
    private log : HTMLElement;
    private keypadAndIndicators : HTMLElement;
    private userAnswerBox : HTMLInputElement;
    private keypad : HTMLElement;
    private numericEntry : HTMLElement;
    private btnStartOver : HTMLButtonElement;
    private indicators : HTMLElement;
    private latestAnswerField!: HTMLSpanElement;
    private middlePane: HTMLDivElement;

    private readonly initialHtml = `
        <div id="log">
        </div>
        <button id="btnStartOver" style="display:none;">ОТНАЧАЛО :)</button>
        <div id="keypadAndIndicators">
            <div id="numericEntry">
                <input id="userAnswerBox" type="text" enterkeyhint="Да" name="userAnswer" placeholder="Твоят отговор" autocomplete="off"></input>
                <div id="keypad"></div>
            </div>
            <div id="indicators">
                <div id="progressIndicator">
                </div>
                <div id="sessionTimeIndicator">
                </div>
            </div>
        </div>`;

    constructor(private appController : AppController, private gameType : GameTypes.GameType) {
        super();

        document.getElementById("gameSessionPage")!.innerHTML = this.initialHtml;
        this.log = document.getElementById("log") as HTMLElement;
        
        this.keypadAndIndicators = document.getElementById("keypadAndIndicators") as HTMLElement;
        this.userAnswerBox = document.getElementById("userAnswerBox") as HTMLInputElement;
        this.numericEntry = document.getElementById("numericEntry") as HTMLInputElement;
        this.btnStartOver = document.getElementById("btnStartOver") as HTMLButtonElement;
        this.indicators = document.getElementById("indicators") as HTMLElement;
        this.keypad = document.getElementById("keypad") as HTMLElement;
        this.middlePane = document.getElementById("middlePane") as HTMLDivElement;
        
        this.btnStartOver.addEventListener("click", () => {
            this.btnStartOver.style.display = "none";
            this.beginNewSession();
        });
        
        this.userAnswerBox.addEventListener("keydown", (e: KeyboardEvent) => {
            if(e.key === "Enter") {
                this.onUserPressedEnter();
            }
            return false;
        });

        this.#buildKeypad();

        if(util.isMobileDevice()) {
            this.keypad.style.display = "grid";
            this.userAnswerBox.style.display = "none";
        } else {
            this.keypad.style.display = "none";
            this.userAnswerBox.style.display = "block";
        }

        this.timerId = window.setInterval(() => {
            if(!this.inActiveSession) {
                return;
            }
            if(this.getTimeLeftMs() <= 0) {
                this.timeOut();
                return;
            }
            this.updateSessionTimeIndicator();
        }, 1000);

        this.beginNewSession();
    }

    onLeave() {
        window.clearInterval(this.timerId);
    }

    private timeOut() {
        this.informUser(`Времето ти свърши!`, "red", true);
        this.informUser(`Това не значи че си се провалил, а че още се учиш 😜.
            \nМоля направи скрийншот и ми го пратѝ!`, "black", true);
        const stats = this.gameSession.getResultStats();
        
        this.informUser("   • Ти игра в режим " + stats.gameType.localizedName + ".", "black");
        this.informUser("   • Текущи точки: " + stats.pointsTowardWin + ".", "black");
        this.informUser("   • Максимални точки този път: " + stats.maxReachedPointsTowardWin + ".", "black");
        this.informUser("   • Пробвани задачи: " + stats.problemsAttempted + ".", "black");
        this.informUser("   • Позна " + stats.percentCorrectOnFirstTry + "% от първи опит.", "black");
        
        this.onSessionFinished();
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
        this.#setupKeypadButton(btnArray, 0, 3, "-");
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

    beginNewSession(): void {
        this.gameSession = new GameSession(this.appController, this, this.gameType);
        
        this.log.textContent = "";
        this.numericEntry.style.display = "block";
        this.updateProgressIndicator();
        this.updateSessionTimeIndicator();
        this.showPrompt();
        this.userAnswerBox.focus();

        this.inActiveSession = true;
    }

    onUserPressedEnter(): void {
        let userAnswerText = this._getUserAnswerText();
        if(!util.isMobileDevice()) {
            this.latestAnswerField.textContent = userAnswerText;
        }
        
        const userAnswer = parseInt(userAnswerText);
        this.gameSession.onUserAnswered(userAnswer);
        this.userAnswerBox.value = "";
    }
    updateProgressIndicator(): void {
        const progressIndicator = document.getElementById("progressIndicator") as HTMLElement;
        progressIndicator.innerHTML = "<b>Точки: " +
            util.ensureTextContainsSign(this.gameSession.pointsTowardWin) +
            '</b>.<br>За победа ти трябват още ' +
            (this.gameSession.pointsRequiredToWin - this.gameSession.pointsTowardWin) +
            " точки и " + (this.gameSession.minProblemsAttemptedToWin - this.gameSession.problemsAttempted) + " пробвани задачи";
    }
    private getTimeLeftMs() {
        return this.gameSession.maxSessionDurationMs - (Date.now() - this.gameSession.gameStartTimestamp);
    }
    updateSessionTimeIndicator(): void {
        const minutesLeft = Math.floor(this.getTimeLeftMs() / 60000);
        const progressIndicator = document.getElementById("sessionTimeIndicator") as HTMLElement;
        progressIndicator.textContent = "Имаш още " + minutesLeft + " минути";
    }
    scrollToBottom(): void {
        this.middlePane.scrollTo({
            top: this.middlePane.scrollHeight,
            left: 0,
            behavior: 'smooth'
        });
    }
    _getUserAnswerText(): string {
        if(util.isMobileDevice()) {
            return this.latestAnswerField.textContent ?? "";
        } else {
            return this.userAnswerBox.value;
        }
    }

    onWin(resultStats: ResultStats): void {
        this.informUser("КЪРТИШ! ПОБЕДА! 🥳\nМоля направи скрийншот и ми го пратѝ.", "green", true);
        
        const minutes = Math.floor(resultStats.timeElapsedMs / 60000);
        const seconds = Math.floor(resultStats.timeElapsedMs / 1000) % 60;
        
        this.informUser("Отне ти " + minutes + "мин " + seconds + "сек. Познал си " + resultStats.percentCorrectOnFirstTry + "% от първи опит.", "black");
        this.onSessionFinished();
    }

    onSessionFinished() {
        this.numericEntry.style.display = "none";
        this.btnStartOver.style.display = "inline";

        this.inActiveSession = false;
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
