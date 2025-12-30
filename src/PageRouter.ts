import { TypedEventEmitter } from "./TypedEventEmitter";

export abstract class Page {
    abstract onLeave() : void;
}

type PageMap = Map<string, HTMLElement>;

type PageRouterEvents = {
  pageChanged: { oldPage: string; newPage: string; query: URLSearchParams };
};

export class PageRouter {
    private pages: PageMap;
    private navLinks: HTMLAnchorElement[];
    #bus = new TypedEventEmitter<PageRouterEvents>();
    private currentRoute : string;
    private currentQuery: URLSearchParams;

    get bus() {
        return this.#bus;
    }

    constructor(private defaultRoute: string) {
        this.currentRoute = defaultRoute;
        this.currentQuery = new URLSearchParams();
        this.pages = this.collectPages();
        this.navLinks = Array.from(document.querySelectorAll("#mainNav a"));

        window.addEventListener("hashchange", () => {
            this.handleHashChange();
        });
    }

    start(): void {
        this.handleHashChange();
    }

    private parseHash(): { route: string; query: URLSearchParams } {
        const rawHash = window.location.hash.replace(/^#/, "");
        const [path, queryString = ""] = rawHash.split("?", 2);
        const route = path || this.defaultRoute;
        return { route, query: new URLSearchParams(queryString) };
    }

    private collectPages(): PageMap {
        const pages = new Map<string, HTMLElement>();
        const nodes = Array.from(document.querySelectorAll<HTMLElement>(".page[data-route]"));
        nodes.forEach((node) => {
            const route = node.dataset.route;
            if (route) {
                pages.set(route, node);
            }
        });
        return pages;
    }

    private handleHashChange(): void {
        const { route, query } = this.parseHash();
        this.showRoute(this.pages.has(route) ? route : this.defaultRoute, query);
    }

    private showRoute(route: string, query: URLSearchParams): void {

        this.pages.forEach((page, key) => {
            page.classList.toggle("isActive", key === route);
        });

        this.navLinks.forEach((link) => {
            const linkRoute = link.getAttribute("href")?.replace(/^#/, "");
            link.classList.toggle("isActive", linkRoute === route);
        });

        this.#bus.emit("pageChanged", { oldPage: this.currentRoute, newPage: route, query });

        this.currentRoute = route;
        this.currentQuery = query;
    }
}
