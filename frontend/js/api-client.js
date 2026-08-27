/*
 * API Client Configuration
 * ---------------------------------------------------------
 * In production (split deployment): API_BASE_URL points to the backend service.
 * In local dev (Express serves everything): requests remain same-origin.
 * When previewing via Live Server (port != 3000): proxy to localhost:3000.
 */
(function configureApiClient() {
  // Production backend URL – set this to your deployed backend origin.
  // When empty or "/", requests go same-origin (monolith mode).
  const API_BASE_URL = window.__GO_SMOOTHIE_API_URL || "";

  const isLocalPreview =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port !== "3000";

  if (window.__goSmoothieApiProxyInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.fetch = function goSmoothieFetch(input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      if (API_BASE_URL) {
        // Production split mode: route to backend service
        return originalFetch(`${API_BASE_URL}${input}`, init);
      } else if (isLocalPreview) {
        // Local dev with Live Server
        return originalFetch(`http://${window.location.hostname}:3000${input}`, init);
      }
    }
    return originalFetch(input, init);
  };

  window.__goSmoothieApiProxyInstalled = true;
})();
