// --- Block 1 ---
// Password strength utilities
      function evaluatePassword(pw) {
        return {
          len: pw.length >= 8,
          upper: /[A-Z]/.test(pw),
          num: /\d/.test(pw),
          special: /[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/.test(pw),
        };
      }

      const resetPwdInput = document.getElementById("resetPassword");
      const resetConfirmInput = document.getElementById("resetConfirm");
      const resetPwdChecklist = document.getElementById("resetPwdChecklist");
      const resetChecks = [
        "resetCheck1",
        "resetCheck2",
        "resetCheck3",
        "resetCheck4",
        "resetCheck5",
      ];
      const resetCheckRules = ["len", "upper", "num", "special", "match"];

      function updateResetPasswordRules() {
        const v = resetPwdInput.value || "";
        const confirmValue = resetConfirmInput
          ? resetConfirmInput.value || ""
          : "";
        if (!v && !confirmValue) {
          resetPwdChecklist.classList.add("hidden");
          return;
        }
        const s = evaluatePassword(v);
        const match = v.length > 0 && v === confirmValue;
        resetPwdChecklist.classList.remove("hidden");

        resetChecks.forEach((id, idx) => {
          const el = document.getElementById(id);
          const isValid =
            resetCheckRules[idx] === "match" ? match : s[resetCheckRules[idx]];
          if (isValid) {
            el.className = "flex items-center gap-2 text-green-700";
            el.querySelector("svg, i").outerHTML =
              '<i class="bi bi-check-circle text-green-500"></i>';
          } else {
            el.className = "flex items-center gap-2 text-gray-600";
            el.querySelector("svg, i").outerHTML =
              '<i class="bi bi-circle text-gray-400"></i>';
          }
        });
      }

      resetPwdInput.addEventListener("input", updateResetPasswordRules);
      if (resetConfirmInput)
        resetConfirmInput.addEventListener("input", updateResetPasswordRules);
      updateResetPasswordRules();

      document
        .getElementById("resetForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const errorMsg = document.getElementById("errorMsg");
          const successMsg = document.getElementById("successMsg");
          errorMsg.classList.add("hidden");
          successMsg.classList.add("hidden");

          const email = document.getElementById("resetEmail").value.trim();
          const password = document.getElementById("resetPassword").value;
          const confirm = document.getElementById("resetConfirm").value;

          if (!password || !confirm) {
            errorMsg.textContent = "Please fill in all password fields";
            errorMsg.classList.remove("hidden");
            return;
          }

          if (password !== confirm) {
            errorMsg.textContent = "Passwords do not match";
            errorMsg.classList.remove("hidden");
            return;
          }

          // enforce same rules as server: min 8, uppercase, number, special
          const pwdRe =
            /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]).{8,}$/;
          if (!pwdRe.test(password)) {
            errorMsg.textContent =
              "Password must be 8+ characters and include an uppercase letter, a number, and a special character";
            errorMsg.classList.remove("hidden");
            return;
          }

          try {
            // NOTE: This assumes a /api/users/reset-password endpoint exists on your server
            // You may need to implement this endpoint if it doesn't exist
            const res = await fetch("/api/users/reset-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (res.ok || data.message) {
              successMsg.textContent =
                "Password reset successfully! Redirecting to login...";
              successMsg.classList.remove("hidden");
              setTimeout(() => {
                window.location.href = "/login.html";
              }, 2000);
            } else {
              errorMsg.textContent =
                data.error || "Password reset failed. Please try again.";
              errorMsg.classList.remove("hidden");
            }
          } catch (err) {
            errorMsg.textContent = "Error: " + err.message;
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
