// quick error reporter so runtime errors show up on the page
export class QuickDebugLogger {
    static #instance: QuickDebugLogger | null = null;

    static get instance() {
        if (QuickDebugLogger.#instance === null) {
            QuickDebugLogger.#instance = new QuickDebugLogger();
        }
        return QuickDebugLogger.#instance;
    }
    
    log(msg: string, level: 'error' | 'warn' | 'info' | 'log' = 'error') {
        const pre = document.createElement('p');
        pre.style.position = 'fixed';
        pre.style.left = '0';
        pre.style.bottom = '0';
        pre.style.right = '0';
        pre.style.background = level === 'error' ? 'rgba(255,200,200,0.95)' : 'rgba(255,255,200,0.95)';
        pre.style.color = '#000';
        pre.style.zIndex = '99999';
        pre.style.padding = '8px';
        pre.style.margin = '0';
        pre.style.fontSize = '12px';
        pre.textContent = msg;
        document.body.appendChild(pre);
    }

    beginListeningForErrors(): void {
        window.addEventListener('error', (evt) => {
            this.log(`ERROR: ${evt.message} at ${evt.filename}:${evt.lineno}:${evt.colno}`);
        });

        window.addEventListener('unhandledrejection', (evt) => {
            this.log(`UNHANDLED PROMISE REJECTION: ${String(evt.reason)}`);
        });
    }
}
