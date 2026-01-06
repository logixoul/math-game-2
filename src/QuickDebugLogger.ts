// quick error reporter so runtime errors show up on the page
export class QuickDebugLogger {
    static #instance: QuickDebugLogger | null = null;
    #container: HTMLDivElement | null = null;
    #list: HTMLDivElement | null = null;

    static get instance() {
        if (QuickDebugLogger.#instance === null) {
            QuickDebugLogger.#instance = new QuickDebugLogger();
        }
        return QuickDebugLogger.#instance;
    }
    
    log(msg: string, level: 'error' | 'warn' | 'info' | 'log' = 'error') {
        const container = this.#ensureConsole();
        const list = this.#list;
        if (!list) {
            return;
        }
        const entry = document.createElement('div');
        entry.style.padding = '6px 8px';
        entry.style.borderTop = '1px solid rgba(255,255,255,0.15)';
        entry.style.background = level === 'error' ? 'rgba(120,20,20,0.35)' : 'rgba(120,120,20,0.2)';
        entry.textContent = msg;
        list.appendChild(entry);
        container.style.display = 'block';
    }

    beginListeningForErrors(): void {
        window.addEventListener('error', (evt) => {
            this.log(`ERROR: ${evt.message} at ${evt.filename}:${evt.lineno}:${evt.colno}`);
        });

        window.addEventListener('unhandledrejection', (evt) => {
            this.log(`UNHANDLED PROMISE REJECTION: ${String(evt.reason)}`);
        });
    }

    #ensureConsole(): HTMLDivElement {
        if (this.#container && this.#list) {
            return this.#container;
        }
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.right = '0';
        container.style.bottom = '0';
        container.style.height = '20vh';
        container.style.background = 'rgba(20,20,20,0.92)';
        container.style.color = '#fff';
        container.style.zIndex = '99999';
        container.style.fontSize = '12px';
        container.style.fontFamily = 'Consolas, "Courier New", monospace';
        container.style.display = 'none';
        container.style.boxShadow = '0 -2px 12px rgba(0,0,0,0.35)';

        const title = document.createElement('div');
        title.textContent = 'Error Console (beta)';
        title.style.padding = '6px 8px';
        title.style.background = 'rgba(0,0,0,0.5)';
        title.style.fontWeight = 'bold';
        title.style.borderBottom = '1px solid rgba(255,255,255,0.15)';
        container.appendChild(title);

        const list = document.createElement('div');
        list.style.overflowY = 'auto';
        list.style.height = 'calc(20vh - 28px)';
        container.appendChild(list);

        document.body.appendChild(container);
        this.#container = container;
        this.#list = list;
        return container;
    }
}
