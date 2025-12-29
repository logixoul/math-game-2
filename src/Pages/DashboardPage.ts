import * as PageRouter from "../PageRouter"
import { AppController } from "../AppController";

export class DashboardPage extends PageRouter.Page {
    private freePlayGameTypeList : HTMLUListElement;
    private helloNameContainer : HTMLSpanElement;
    
    private readonly initialHtml = `
        <h2>Привет, <span id="helloNameContainer"></span>!</h2>
        <section id="currentHomeworkDashboardSection">
            <h3>Сегашно домашно</h3>
        </section>
        <section id="freePlayDashboardSection">
            <h3>Игра по избор</h3>
            <ul id="freePlayGameTypeList">
            </ul>
        </section>
    `;

    constructor(private appController : AppController) {
        super();

        document.getElementById("dashboardPage")!.innerHTML = this.initialHtml;
        this.freePlayGameTypeList = document.getElementById("freePlayGameTypeList") as HTMLUListElement;
        this.helloNameContainer = document.getElementById("helloNameContainer") as HTMLSpanElement;
        this.initGameTypeList();

        if(this.appController.userEmail !== null) {
            this.helloNameContainer.innerText = this.appController.userEmail;
        }

        // todo: unsubscribe on navigating-away?
        this.appController.firebaseController.bus.on("loggedIn", ({ user }) => {
            this.helloNameContainer.innerText = user.email!;
        });
        this.appController.firebaseController.bus.on("loggedOut", () => {
            this.helloNameContainer.innerText = "страннико";
        });
    }

    private initGameTypeList(): void {
        const gameTypes = this.appController.getAvailableGameTypes();
        gameTypes.forEach((gameType: GameTypes.GameType) => {
            const gameTypeLink = document.createElement("li") as HTMLLIElement;
            gameTypeLink.addEventListener("click", () => {
                window.location.hash = `game?type=${encodeURIComponent(gameType.persistencyKey)}`;
            });
            gameTypeLink.innerText = gameType.localizedName;
            this.freePlayGameTypeList.appendChild(gameTypeLink);
        });
    }
}
