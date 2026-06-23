import { registerSW } from 'virtual:pwa-register';

// autoUpdate only re-checks for a new service worker on page load. A long-lived
// session (especially the installed standalone PWA) can run stale code for days,
// so poll for updates hourly; when one is found, the autoUpdate SW activates and
// reloads the page. Game state lives in localStorage, so the reload is lossless.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function registerServiceWorker(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(swScriptUrl, registration) {
      if (!registration) return;
      setInterval(async () => {
        if (registration.installing || !navigator.onLine) return;
        try {
          const resp = await fetch(swScriptUrl, { cache: 'no-store' });
          if (resp.ok) await registration.update();
        } catch {
          // offline or transient network error — try again next interval
        }
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });
}
