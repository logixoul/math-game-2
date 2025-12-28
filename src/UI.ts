import * as PromptTypes from './GameTypes';
import { QuickDebugLogger } from './QuickDebugLogger';
import type { AppController } from './AppController';
import type { GameTypeCtor } from './GameTypes';
import type { GameSession } from './GameSession';
import { ResultStats } from './ResultStats';
import { PageRouter, Page } from './PageRouter';
import * as util from './util'
import * as Pages from './Pages'

export class UIController {
    private middlePane = document.getElementById("middlePane") as HTMLElement;

    private btnMenu = document.getElementById("btnMenu") as HTMLButtonElement;
    private header = document.getElementById("header") as HTMLElement;
    private menuContents = document.getElementById("menuContents") as HTMLElement;
    private loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
    private userInfo = document.getElementById("userInfo") as HTMLElement;
    private logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
    private freePlayGameTypeList = document.getElementById("freePlayGameTypeList") as HTMLUListElement;
    private helloNameContainer = document.getElementById("helloNameContainer") as HTMLSpanElement;
    private pageRouter = new PageRouter("dashboard");
    private currentPage : Page;
    
    constructor(public appController: AppController) {
        this.currentPage = new Pages.DashboardPage();

        this.pageRouter.bus.on("pageChanged", (e) => {
        })

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
                this.helloNameContainer.innerText = user.email!;
        });
        this.appController.firebaseController.bus.on("loggedOut", () => {
                this.userInfo.innerText = "Не си влязъл в системата";
                this.loginBtn.style.display = "inline";
                this.logoutBtn.style.display = "none";
                this.helloNameContainer.innerText = "страннико";
        });

        this.#initGameTypeList();

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
    }

    

    #initGameTypeList(): void {
        const gameTypes = this.appController.getAvailableGameTypes();
        gameTypes.forEach((gameType: PromptTypes.GameType) => {
            const gameTypeLink = document.createElement("li") as HTMLLIElement;
            gameTypeLink.addEventListener("click", () => {
                this.currentPage = new Pages.GamePage(this.appController, gameType);
                window.location.hash = "game";
            });
            gameTypeLink.innerText = gameType.localizedName;
            this.freePlayGameTypeList.appendChild(gameTypeLink);
        });
    }

    
    adjustMiddlePanePadding(): void {
        document.documentElement.style.setProperty("--header-width", `${this.header.offsetWidth}px`);
        document.documentElement.style.setProperty("--header-height", `${this.header.offsetHeight}px`);
    }
}
