/*
 * When a page is previewed from a local static server (for example VS Code
 * Live Server on port 5500), send its API calls to the Express app on 3000.
 * In production and when served by Express, requests remain same-origin.
 */
(function configureLocalApiProxy() {
  const isLocalPreview =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port !== "3000";

  if (!isLocalPreview || window.__goSmoothieApiProxyInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = function goSmoothieFetch(input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return originalFetch(`http://${window.location.hostname}:3000${input}`, init);
    }
    return originalFetch(input, init);
  };

  window.__goSmoothieApiProxyInstalled = true;
})();
