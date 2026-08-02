// --- Block 1 ---
const apiBaseUrl =
        ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
        window.location.port !== "3000"
          ? `http://${window.location.hostname}:3000`
          : "";
      const apiUrl = (path) => `${apiBaseUrl}${path}`;
      const form = document.getElementById("adminLoginForm");
      const errorMsg = document.getElementById("errorMsg");

      // Password show/hide toggle
      document
        .getElementById("toggleAdminPwd")
        .addEventListener("click", function () {
          const input = document.getElementById("adminPassword");
          const icon = this.querySelector("i");
          if (input.type === "password") {
            input.type = "text";
            icon.className = "bi bi-eye text-xl";
          } else {
            input.type = "password";
            icon.className = "bi bi-eye-slash text-xl";
          }
        });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMsg.classList.add("hidden");
        const formData = new FormData(form);

        try {
          const response = await fetch(apiUrl("/api/admins/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.get("email"),
              password: formData.get("password"),
            }),
          });

          const data = await response.json().catch(() => ({}));
          if (data.token) {
            localStorage.setItem("gs_admin_token", data.token);
            localStorage.setItem("gs_admin_user", JSON.stringify(data.admin));
            window.location.href = "/admin-dashboard.html";
            return;
          }

          errorMsg.textContent =
            data.error ||
            (response.status === 405
              ? "The API server is unavailable. Start the app with npm.cmd run dev and open http://localhost:3000/admin-login.html."
              : "Admin login failed");
          errorMsg.classList.remove("hidden");
        } catch (error) {
          errorMsg.textContent =
            "Unable to reach the API server. Start it with npm.cmd run dev and open http://localhost:3000/admin-login.html.";
          errorMsg.classList.remove("hidden");
        }
      });
