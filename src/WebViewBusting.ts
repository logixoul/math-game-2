function isMobileUserAgent(): boolean {
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod/i.test(ua);
}

function isLikelyInAppBrowserOrWebView(): boolean {
    const ua = navigator.userAgent || "";

    // Android WebView често съдържа "wv" или "; wv)".
    const isAndroidWebView = /\bwv\b/.test(ua) || /; wv\)/.test(ua);

    // In-app browsers (FB/IG/etc)
    const isInApp =
        /FBAN|FBAV|Instagram|Line|Twitter|TikTok|Snapchat|Pinterest|Messenger|Viber/i.test(ua);

    // Някои webviews инжектират такива обекти (не е гарантирано, но помага)
    const isReactNativeWebView = (window as any).ReactNativeWebView != null;

    return isAndroidWebView || isInApp || isReactNativeWebView;
}

/** Best-effort "Open in Chrome" (Android only). */
export function tryOpenInChromeAndroid(): void {
    const ua = navigator.userAgent || "";
    if (!/Android/i.test(ua)) return;

    const url = window.location.href;
    // intent://HOST/PATH#Intent;scheme=https;package=com.android.chrome;end
    // NOTE: Това работи в много случаи, но не е 100% гарантирано.
    const u = new URL(url);
    const intentUrl =
        `intent://${u.host}${u.pathname}${u.search}${u.hash}` +
        `#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;

    window.location.href = intentUrl;
}