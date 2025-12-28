import { TypedEventEmitter } from "./TypedEventEmitter";

type PageMap = Map<string, HTMLElement>;

type PageRouterEvents = {
  pageChanged: { newPage : string };
};

export class PageRouter {
    private pages: PageMap;
    private navLinks: HTMLAnchorElement[];
    #bus = new TypedEventEmitter<PageRouterEvents>();

    get bus() {
        return this.#bus;
    }

    constructor(private defaultRoute: string) {
        this.pages = this.collectPages();
        this.navLinks = Array.from(document.querySelectorAll("#mainNav a"));

        window.addEventListener("hashchange", () => {
            this.handleHashChange();
        });

        this.handleHashChange();
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
        const rawHash = window.location.hash.replace(/^#/, "");
        const route = rawHash || this.defaultRoute;
        this.showRoute(this.pages.has(route) ? route : this.defaultRoute);
    }

    private showRoute(route: string): void {
        this.pages.forEach((page, key) => {
            page.classList.toggle("isActive", key === route);
        });

        this.navLinks.forEach((link) => {
            const linkRoute = link.getAttribute("href")?.replace(/^#/, "");
            link.classList.toggle("isActive", linkRoute === route);
        });

        this.#bus.emit("pageChanged", { newPage: route });
    }
}
