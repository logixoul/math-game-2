// quick error reporter so runtime errors show up on the page
export class QuickDebugLogger {
    static #_instance = null;

    static get instance() {
        if (QuickDebugLogger.#_instance === null) {
            QuickDebugLogger.#_instance = new QuickDebugLogger();
        }
        return QuickDebugLogger.#_instance;
    }
    log(msg, level = 'error') {
        const pre = document.createElement('pre');
        pre.style.position = 'fixed';
        pre.style.left = '0';
        pre.style.bottom = '0';
        pre.style.right = '0';
        pre.style.background = level === 'error' ? 'rgba(255,200,200,0.95)' : 'rgba(255,255,200,0.95)';
        pre.style.color = '#000';
        pre.style.zIndex = 99999;
        pre.style.padding = '8px';
        pre.style.margin = '0';
        pre.style.fontSize = '12px';
        pre.textContent = msg;
        document.body.appendChild(pre);
    }

    beginListeningForErrors() {
        window.addEventListener('error', function (evt) {
            this.log(`ERROR: ${evt.message} at ${evt.filename}:${evt.lineno}:${evt.colno}`);
        }.bind(this));

        window.addEventListener('unhandledrejection', function (evt) {
            this.log(`UNHANDLED PROMISE REJECTION: ${String(evt.reason)}`);
        }.bind(this));
    }
}
export let quickDebugLogger = new QuickDebugLogger();