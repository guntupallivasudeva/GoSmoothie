// --- Block 1 ---
(function () {
        function toggleHomeLink() {
          const isHome =
            window.location.pathname === "/" ||
            window.location.pathname.endsWith("main.html") ||
            window.location.pathname.endsWith("index.html");
          document.querySelectorAll("header nav a").forEach((a) => {
            if (
              a.textContent &&
              a.textContent.trim().toLowerCase() === "home"
            ) {
              a.style.display = isHome ? "none" : "";
            }
          });
        }

        const toTopBtn = document.getElementById("toTopBtn");
        function onScroll() {
          if (window.scrollY > 200) toTopBtn.classList.remove("hidden");
          else toTopBtn.classList.add("hidden");
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        toTopBtn.addEventListener("click", () =>
          window.scrollTo({ top: 0, behavior: "smooth" }),
        );

        toggleHomeLink();
        window.addEventListener("popstate", toggleHomeLink);
      })();
