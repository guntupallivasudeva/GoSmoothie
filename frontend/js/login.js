// --- Block 1 ---
const apiBaseUrl =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  window.location.port !== "3000"
    ? `http://${window.location.hostname}:3000`
    : "";
const apiUrl = (path) => `${apiBaseUrl}${path}`;

// Password strength utilities for login (UI only)
function evaluatePassword(pw) {
  return {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /\d/.test(pw),
    special: /[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/.test(pw),
  };
}

const loginPwdInput = document.getElementById("loginPassword");
const loginPwdChecklist = document.getElementById("loginPwdChecklist");
const loginChecks = [
  "loginCheck1",
  "loginCheck2",
  "loginCheck3",
  "loginCheck4",
];
const loginCheckRules = ["len", "upper", "num", "special"];

loginPwdInput.addEventListener("input", () => {
  const v = loginPwdInput.value || "";
  if (!v) {
    loginPwdChecklist.classList.add("hidden");
    return;
  }
  const s = evaluatePassword(v);
  loginPwdChecklist.classList.remove("hidden");

  loginChecks.forEach((id, idx) => {
    const el = document.getElementById(id);
    const isValid = s[loginCheckRules[idx]];
    if (isValid) {
      el.className = "text-green-500";
      el.innerHTML = '<i class="bi bi-check"></i>';
    } else {
      el.className = "text-gray-400";
      el.innerHTML = '<i class="bi bi-x"></i>';
    }
  });
});

// Password show/hide toggle
document
  .getElementById("toggleLoginPwd")
  .addEventListener("click", function () {
    const input = document.getElementById("loginPassword");
    const icon = this.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.className = "bi bi-eye text-xl";
    } else {
      input.type = "password";
      icon.className = "bi bi-eye-slash text-xl";
    }
  });

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorMsg = document.getElementById("errorMsg");
  errorMsg.classList.add("hidden");

  const f = new FormData(e.target);
  try {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: f.get("email"),
        password: f.get("password"),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (data.token) {
      // Stores the session in localStorage and mirrors it into cookies,
      // which are shared across localhost ports unlike localStorage.
      window.GoSmoothieSession.setSession(data.token, data.user);
      // merge anonymous cart into user cart
      const clientId = localStorage.getItem("gs_clientId");
      if (clientId) {
        await fetch(apiUrl("/api/cart/merge"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + data.token,
          },
          body: JSON.stringify({ clientId }),
        });
        localStorage.removeItem("gs_clientId");
      }
      // A Live Server preview and the Express app use different localhost
      // ports, so their localStorage is isolated. Carry the just-created
      // session in the fragment (never sent to the server) to hydrate the
      // destination page, then it is removed immediately.
      const handoff = new URLSearchParams({
        gs_token: data.token,
        gs_user: JSON.stringify(data.user || {}),
      });
      // Return the visitor to the page that sent them here.
      const requestedNext = new URLSearchParams(window.location.search).get(
        "next",
      );
      const nextPath =
        requestedNext && requestedNext.startsWith("/")
          ? requestedNext
          : "/main.html";
      window.location.href = `${apiBaseUrl}${nextPath}#${handoff.toString()}`;
    } else {
      const msg =
        data.error ||
        (res.status === 405
          ? "The API server is unavailable. Start the app with npm.cmd run dev and open http://localhost:3000/login.html."
          : "Login failed. Please try again.");
      if (res.status === 403) {
        showToast(msg, "error");
      } else {
        showToast(msg, "error");
      }
      errorMsg.textContent = msg;
      errorMsg.classList.remove("hidden");
    }
  } catch (error) {
    const msg =
      "Unable to reach the API server. Start it with npm.cmd run dev and open http://localhost:3000/login.html.";
    showToast(msg, "error");
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }
});
