// --- Block 1 ---
function evaluatePassword(pw) {
        return {
          len: pw.length >= 8,
          upper: /[A-Z]/.test(pw),
          num: /\d/.test(pw),
          special: /[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/.test(pw),
        };
      }

      const regPwdInput = document.querySelector('input[name="password"]');
      const regPwdChecklist = document.getElementById("regPwdChecklist");
      const regChecks = ["regCheck1", "regCheck2", "regCheck3", "regCheck4"];
      const regCheckRules = ["len", "upper", "num", "special"];

      if (regPwdInput && regPwdChecklist) {
        regPwdInput.addEventListener("input", () => {
          const v = regPwdInput.value || "";
          if (!v) {
            regPwdChecklist.classList.add("hidden");
            return;
          }
          const s = evaluatePassword(v);
          regPwdChecklist.classList.remove("hidden");

          regChecks.forEach((id, idx) => {
            const el = document.getElementById(id);
            const icon = el?.querySelector("i, svg");
            const isValid = s[regCheckRules[idx]];
            if (isValid) {
              el.className = "flex items-center gap-2 text-green-700";
              if (icon)
                icon.outerHTML =
                  '<i class="bi bi-check w-5 h-5 text-green-500"></i>';
            } else {
              el.className = "flex items-center gap-2 text-gray-600";
              if (icon)
                icon.outerHTML =
                  '<i class="bi bi-x w-5 h-5 text-gray-400"></i>';
            }
          });
        });
      }

      document
        .getElementById("regForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const errorMsg = document.getElementById("errorMsg");
          errorMsg.classList.add("hidden");

          const f = new FormData(e.target);
          const apiBaseUrl =
            ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
            window.location.port !== "3000"
              ? `http://${window.location.hostname}:3000`
              : "";
          const apiUrl = (path) => `${apiBaseUrl}${path}`;
          const res = await fetch(apiUrl("/api/auth/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: f.get("name"),
              email: f.get("email"),
              password: f.get("password"),
            }),
          });

          const data = await res.json();
          if (data.token) {
            // Same shared session as the login page, cookies included, so the
            // new account is recognised on every page right away.
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
            // Carry the session in the fragment as well, so a preview served
            // from another local port still lands signed in.
            const handoff = new URLSearchParams({
              gs_token: data.token,
              gs_user: JSON.stringify(data.user || {}),
            });
            window.location.href = `${apiBaseUrl}/main.html#${handoff.toString()}`;
          } else {
            errorMsg.textContent =
              data.error || "Registration failed. Please try again.";
            errorMsg.classList.remove("hidden");
          }
        });

// --- Block 2 ---
(function () {
        document.querySelectorAll('input[type="password"]').forEach((input) => {
          if (input.dataset.pwToggle) return;
          const wrapper = document.createElement("div");
          wrapper.className = "relative";
          input.parentNode.insertBefore(wrapper, input);
          wrapper.appendChild(input);
          input.dataset.pwToggle = "1";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("aria-label", "Toggle password visibility");
          btn.className =
            "absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1";
          btn.innerHTML = '<i class="bi bi-eye w-5 h-5"></i>';
          wrapper.appendChild(btn);
          btn.addEventListener("click", () => {
            if (input.type === "password") {
              input.type = "text";
              btn.innerHTML = '<i class="bi bi-eye-slash w-5 h-5"></i>';
            } else {
              input.type = "password";
              btn.innerHTML = '<i class="bi bi-eye w-5 h-5"></i>';
            }
          });
        });
      })();
