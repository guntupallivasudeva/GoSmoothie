/*
 * Shared browser session for the GoSmoothie storefront.
 *
 * Every page used to keep its own copy of the token/user/clientId helpers, and
 * only some pages restored the session that login.html hands over. That is why
 * a visitor who signed in on the login page could still be asked to sign in
 * again on the profile page. This module is the single source of truth:
 *
 *   - restores the session from the URL fragment or cookie into localStorage
 *   - exposes one API (window.GoSmoothieSession) for token/user/clientId
 *   - drops the stored session automatically when the API reports that it is
 *     no longer valid (HTTP 401 with code SESSION_INVALID), so a token for a
 *     deleted account can never keep the cart or profile broken
 *
 * Load it after api-client.js and before any page script.
 */
(function initGoSmoothieSession(global) {
  if (global.GoSmoothieSession) return;

  const TOKEN_KEY = "gs_token";
  const USER_KEY = "gs_user";
  const CLIENT_KEY = "gs_clientId";
  const COOKIE_MAX_AGE = 604800; // 7 days, matching the JWT lifetime.

  function readCookie(name) {
    const prefix = `${name}=`;
    const found = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix));
    return found ? decodeURIComponent(found.slice(prefix.length)) : "";
  }

  function writeCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(
      value,
    )}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }

  // Login can happen on a different local origin (Live Server on 5500 vs the
  // Express app on 3000), where localStorage is not shared. The fragment
  // handoff and the cookie mirror bridge that gap.
  function restore() {
    const fragment = new URLSearchParams(
      (global.location.hash || "").replace(/^#/, ""),
    );
    const token = fragment.get(TOKEN_KEY) || readCookie(TOKEN_KEY);
    const user = fragment.get(USER_KEY) || readCookie(USER_KEY);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, user);
      writeCookie(TOKEN_KEY, token);
      if (user) writeCookie(USER_KEY, user);
    } else if (localStorage.getItem(TOKEN_KEY)) {
      // Keep the cookie in step so sibling pages and ports see the session.
      writeCookie(TOKEN_KEY, localStorage.getItem(TOKEN_KEY));
      const stored = localStorage.getItem(USER_KEY);
      if (stored) writeCookie(USER_KEY, stored);
    }
    if (fragment.get(TOKEN_KEY)) {
      history.replaceState(
        null,
        "",
        `${global.location.pathname}${global.location.search}`,
      );
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function setSession(token, user) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      writeCookie(TOKEN_KEY, token);
    }
    if (user) {
      const serialized = JSON.stringify(user);
      localStorage.setItem(USER_KEY, serialized);
      writeCookie(USER_KEY, serialized);
    }
  }

  function setUser(user) {
    setSession(null, user);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  // Clears the signed-in session everywhere it is stored. The guest cart id is
  // kept by default so an anonymous cart survives a logout.
  function clearSession({ keepClientId = true } = {}) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!keepClientId) localStorage.removeItem(CLIENT_KEY);
    deleteCookie(TOKEN_KEY);
    deleteCookie(USER_KEY);
  }

  function getClientId() {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = `c_${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  }

  function authHeaders(extra) {
    const token = getToken();
    return Object.assign(
      {},
      extra || {},
      token ? { Authorization: `Bearer ${token}` } : {},
    );
  }

  function jsonHeaders() {
    return authHeaders({ "Content-Type": "application/json" });
  }

  // Anonymous requests must carry the guest id; signed-in ones must not, so the
  // server always resolves the same owner for a cart.
  function apiUrl(path) {
    if (isLoggedIn()) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}clientId=${encodeURIComponent(getClientId())}`;
  }

  function withClientId(body) {
    const payload = Object.assign({}, body || {});
    if (!isLoggedIn()) payload.clientId = getClientId();
    return payload;
  }

  function loginUrl(next) {
    const target = next || global.location.pathname + global.location.search;
    return `/login.html?next=${encodeURIComponent(target)}`;
  }

  function redirectToLogin(next) {
    global.location.href = loginUrl(next);
  }

  function logout(redirectTo = "/main.html") {
    clearSession({ keepClientId: false });
    global.location.href = redirectTo;
  }

  // A session the server has rejected is removed once, then the page is
  // reloaded so it renders in its signed-out state and keeps working (the cart
  // falls back to the guest id). Sign-in stays on the login page.
  let handlingInvalidSession = false;
  function handleInvalidSession() {
    if (handlingInvalidSession) return;
    handlingInvalidSession = true;
    clearSession();
    global.dispatchEvent(new Event("sessionInvalid"));
    const onLoginPage = /\/(login|register)\.html$/.test(
      global.location.pathname,
    );
    if (onLoginPage) return;
    if (global.GoSmoothieSession.onInvalidSession) {
      global.GoSmoothieSession.onInvalidSession();
      return;
    }
    global.location.reload();
  }

  // Watch every API response for the dead-session marker without disturbing
  // the callers: the body is inspected on a clone.
  const originalFetch = global.fetch.bind(global);
  global.fetch = function goSmoothieSessionFetch(input, init) {
    return originalFetch(input, init).then((response) => {
      if (response && response.status === 401) {
        response
          .clone()
          .json()
          .then((data) => {
            if (data && data.code === "SESSION_INVALID") handleInvalidSession();
          })
          .catch(() => {});
      }
      return response;
    });
  };

  // Wires the shared header markup (#authLinks / #userMenu / #logoutBtn) so
  // every page shows the same signed-in state.
  function renderAuthHeader() {
    const authLinks = document.getElementById("authLinks");
    const userMenu = document.getElementById("userMenu");
    const userMenuBtn = document.getElementById("userMenuBtn");
    const dropdown = document.getElementById("userMenuDropdown");
    const nameEl = document.getElementById("userName");
    const user = isLoggedIn() ? getUser() : null;

    if (user && (user.name || user.email)) {
      if (authLinks) authLinks.style.display = "none";
      if (userMenu) userMenu.classList.remove("hidden");
      if (nameEl)
        nameEl.textContent = String(user.name || user.email).split(" ")[0];
      if (userMenuBtn)
        userMenuBtn.onclick = () => {
          global.location.href = "/profile.html";
        };
      if (userMenu && dropdown) {
        let closeTimer;
        const open = () => {
          clearTimeout(closeTimer);
          dropdown.classList.remove(
            "opacity-0",
            "invisible",
            "pointer-events-none",
            "translate-y-1",
          );
          dropdown.classList.add(
            "opacity-100",
            "visible",
            "pointer-events-auto",
            "translate-y-0",
          );
        };
        const close = () => {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(() => {
            dropdown.classList.add(
              "opacity-0",
              "invisible",
              "pointer-events-none",
              "translate-y-1",
            );
            dropdown.classList.remove(
              "opacity-100",
              "visible",
              "pointer-events-auto",
              "translate-y-0",
            );
          }, 180);
        };
        userMenu.onmouseenter = open;
        userMenu.onmouseleave = close;
        dropdown.onmouseenter = open;
        dropdown.onmouseleave = close;
      }
    } else {
      if (authLinks) authLinks.style.display = "flex";
      if (userMenu) userMenu.classList.add("hidden");
    }
  }

  restore();

  global.GoSmoothieSession = {
    TOKEN_KEY,
    USER_KEY,
    CLIENT_KEY,
    restore,
    getToken,
    getUser,
    setSession,
    setUser,
    isLoggedIn,
    clearSession,
    getClientId,
    authHeaders,
    jsonHeaders,
    apiUrl,
    withClientId,
    loginUrl,
    redirectToLogin,
    logout,
    renderAuthHeader,
    handleInvalidSession,
    onInvalidSession: null,
  };
})(window);
