// quick error reporter so runtime errors show up on the page
export function installErrorReporter() {
    function show(msg, level = 'error') {
        try {
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
        } catch (e) {
            console.error('error reporter failed', e);
        }
    }

    window.addEventListener('error', function (evt) {
        show(`ERROR: ${evt.message} at ${evt.filename}:${evt.lineno}:${evt.colno}`);
    });

    window.addEventListener('unhandledrejection', function (evt) {
        show(`UNHANDLED PROMISE REJECTION: ${String(evt.reason)}`);
    });
}