/**
 * Service Worker Registration Utility
 * Registers the offline-caching service worker in production.
 */

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) {
    console.warn("[SW] Service Workers not supported in this browser.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("[SW] Registered with scope:", registration.scope);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              console.log("[SW] New service worker activated. Content cached for offline.");
            }
          });
        }
      });
    } catch (error) {
      console.error("[SW] Registration failed:", error);
    }
  });
}
