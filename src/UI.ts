import * as GameTypes from './GameTypes';
import { QuickDebugLogger } from './QuickDebugLogger';
import type { AppController } from './AppController';
import type { GameTypeCtor } from './GameTypes';
import type { GameSession } from './GameSession';
import { ResultStats } from './ResultStats';
import { PageRouter, Page } from './PageRouter';
import * as util from './util'
import { GameSessionPage } from './Pages/GameSessionPage';
import { DashboardPage } from './Pages/DashboardPage';

export class UIController {
    private middlePane = document.getElementById("middlePane") as HTMLElement;

    private btnMenu = document.getElementById("btnMenu") as HTMLButtonElement;
    private header = document.getElementById("header") as HTMLElement;
    private menuContents = document.getElementById("menuContents") as HTMLElement;
    private loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
    private userInfo = document.getElementById("userInfo") as HTMLElement;
    private logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
    private pageRouter = new PageRouter("dashboard");
    private currentPage! : Page;
    
    constructor(public appController: AppController) {
        this.pageRouter.bus.on("pageChanged", (e) => {
            if (e.newPage === "game") {
                const gameTypeKey = e.query.get("type");
                if (!gameTypeKey) {
                    window.location.hash = "dashboard";
                    return;
                }
                const gameType = this.appController
                    .getAvailableGameTypes()
                    .find((type) => type.persistencyKey === gameTypeKey);
                if (!gameType) {
                    window.location.hash = "dashboard";
                    return;
                }
                this.currentPage = new GameSessionPage(this.appController, gameType);
                return;
            }
            if (e.newPage === "dashboard") {
                this.currentPage = new DashboardPage(this.appController);
            }
        })
        this.pageRouter.start();

        this.btnMenu.addEventListener("click", () => {
            if(this.menuContents.style.display === "flex") {
                this.menuContents.style.display = "none";
            } else {
                this.menuContents.style.display = "flex";
            }
        });
        document.addEventListener("click", (event) => {
            if (this.menuContents.style.display !== "flex") {
                return;
            }
            const target = event.target as Node | null;
            if (!target) {
                return;
            }
            if (this.menuContents.contains(target) || this.btnMenu.contains(target)) {
                return;
            }
            this.menuContents.style.display = "none";
        });
        this.menuContents.addEventListener("click", (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) {
                return;
            }
            if (target.closest("a")) {
                this.menuContents.style.display = "none";
            }
        });

        this.loginBtn.addEventListener("click", () => {
            this.appController.firebaseController.login();
        });

        this.logoutBtn.addEventListener("click", () => {
            this.appController.firebaseController.logout();
        });

        this.appController.firebaseController.bus.on("loggedIn", ({ user }) => {
                this.appController.user = user;
                this.userInfo.innerText = "Здравей, " + user.displayName;
                this.loginBtn.style.display = "none";
                this.logoutBtn.style.display = "inline";
        });
        this.appController.firebaseController.bus.on("loggedOut", () => {
                this.appController.user = null;
                this.userInfo.innerText = "Не си влязъл в системата";
                this.loginBtn.style.display = "inline";
                this.logoutBtn.style.display = "none";
        });

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

    adjustMiddlePanePadding(): void {
        document.documentElement.style.setProperty("--header-width", `${this.header.offsetWidth}px`);
        document.documentElement.style.setProperty("--header-height", `${this.header.offsetHeight}px`);
    }
}
