// --- Block 1 ---
// Session state comes from the shared module so this page uses the same
      // token and guest cart id as the rest of the site.
      const session = window.GoSmoothieSession;
      function getClientId() {
        return session.getClientId();
      }

      async function updateCart() {
        const root = document.getElementById("cart-root");
        root.innerHTML =
          '<p class="text-gray-500 text-center py-8">Loading your cart...</p>';
        const token = localStorage.getItem("gs_token");
        let url = "/api/cart";
        if (!token) url += "?clientId=" + getClientId();

        try {
          const res = await fetch(url, {
            headers: token ? { Authorization: "Bearer " + token } : {},
            signal: AbortSignal.timeout(5000),
          });
          // An error response must not be rendered as "your cart is empty".
          // session.js already drops a rejected session, so bail out here.
          if (!res.ok) {
            if (res.status === 401) return;
            throw new Error("Failed to load cart");
          }
          const data = await res.json();

          if (!data.items || data.items.length === 0) {
            root.innerHTML =
              '<div class="text-center py-12"><p class="text-gray-600 text-lg mb-4">Your cart is empty</p><a href="/main.html" class="text-primary font-semibold hover:underline">Start shopping</a></div>';
            updateSummary(0, 0);
            document.getElementById("clearCart").classList.add("hidden");
            document.getElementById("checkout").disabled = true;
            document
              .getElementById("checkout")
              .classList.add("opacity-50", "cursor-not-allowed");
            return;
          }
          document.getElementById("clearCart").classList.remove("hidden");
          document.getElementById("checkout").disabled = false;
          document
            .getElementById("checkout")
            .classList.remove("opacity-50", "cursor-not-allowed");

          root.innerHTML = "";
          let total = 0;
          const fragment = document.createDocumentFragment();

          data.items.forEach((item, index) => {
            total += (item.price || 0) * (item.quantity || 1);
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            const div = document.createElement("div");
            div.className =
              "cart-item-card bg-white/95 backdrop-blur rounded-[2rem] border border-green-100 shadow-xl p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between";
            div.style.animationDelay = `${Math.min(index * 70, 280)}ms`;
            div.dataset.itemId = item.cartId;
            div.innerHTML = `
            <div class="flex items-center gap-4 flex-1">
              <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img src="${item.imageUrl || "/assets/images/smoothie-bowl.jpg"}" alt="${item.name}" class="w-full h-full object-cover" onerror="this.src='/assets/images/smoothie-bowl.jpg'">
              </div>
              <div class="min-w-0">
                <h3 class="text-xl font-semibold text-slate-900">${item.name}</h3>
                <p class="text-slate-600 text-sm mt-1">₹ ${item.price} each</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                <button class="dec px-3 py-2.5 text-gray-600 hover:bg-gray-100" data-id="${item.cartId}" data-price="${item.price}">
                  <i class="bi bi-dash w-5 h-5"></i>
                </button>
                <span class="qty px-4 py-2.5 min-w-12 text-center font-semibold">${item.quantity}</span>
                <button class="inc px-3 py-2.5 text-gray-600 hover:bg-gray-100" data-id="${item.cartId}" data-price="${item.price}">
                  <i class="bi bi-plus w-5 h-5"></i>
                </button>
              </div>
              <div class="text-right min-w-24">
                <p class="item-total font-bold text-slate-900">₹ ${itemTotal}</p>
              </div>
              <button class="remove px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition" data-id="${item.cartId}">
                <i class="bi bi-trash3 text-xl" aria-hidden="true"></i>
              </button>
            </div>
          `;
            fragment.appendChild(div);
          });

          root.appendChild(fragment);
          updateSummary(total, total * 0.1);

          // Wire up event handlers
          document.querySelectorAll(".remove").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              // Store references IMMEDIATELY before any async operations
              const button = e.currentTarget;
              const id = button.dataset.id;
              const parentDiv = button.closest("[data-item-id]");

              const token = localStorage.getItem("gs_token");
              let url = "/api/cart/" + id;
              if (!token) url += "?clientId=" + getClientId();
              const confirmDel = await showModal({
                title: "Remove item",
                message: "Remove this item from your cart?",
                type: "warning",
                okText: "Remove",
                cancelText: "Cancel",
              });
              if (!confirmDel) return;

              // Remove from DOM optimistically
              if (parentDiv) {
                parentDiv.remove();
                recalculateSummary();
              }

              // Send delete request in background
              try {
                const res = await fetch(url, {
                  method: "DELETE",
                  headers: token ? { Authorization: "Bearer " + token } : {},
                  signal: AbortSignal.timeout(5000),
                });
                if (!res.ok) {
                  const errText = await res
                    .text()
                    .catch(() => res.statusText || "Unknown");
                  await showModal({
                    title: "Error",
                    message: "Could not remove item: " + errText,
                    type: "error",
                    okText: "OK",
                    cancelText: "Close",
                  });
                  updateCart(); // Revert on error
                  return;
                }
                // Check if cart is now empty
                const remainingItems =
                  document.querySelectorAll("[data-item-id]");
                if (remainingItems.length === 0) {
                  updateCart(); // Show empty state
                }
              } catch (err) {
                await showModal({
                  title: "Error",
                  message: "Could not remove item: " + err.message,
                  type: "error",
                  okText: "OK",
                  cancelText: "Close",
                });
                updateCart(); // Revert on error
              }
            });
          });

          // Helper: recalculate order summary from DOM
          function recalculateSummary() {
            let cartTotal = 0;
            document.querySelectorAll("[data-item-id]").forEach((itemDiv) => {
              const qtyEl = itemDiv.querySelector(".qty");
              const totalEl = itemDiv.querySelector(".item-total");
              const qty = parseInt(qtyEl.textContent);
              const price = parseFloat(
                itemDiv.querySelector(".inc").dataset.price,
              );
              const itemTot = price * qty;
              totalEl.textContent = "₹ " + itemTot;
              cartTotal += itemTot;
            });
            updateSummary(cartTotal, cartTotal * 0.1);
          }

          // Optimistic quantity update: update UI immediately, send request in background
          function updateQuantityOptimistic(id, newQty, price) {
            const qtyEl = document.querySelector(
              `[data-id="${id}"] ~ span.qty`,
            );
            if (qtyEl) qtyEl.textContent = newQty;
            recalculateSummary();

            // Send request in background
            const token = localStorage.getItem("gs_token");
            let url = "/api/cart/" + id;
            if (!token) url += "?clientId=" + getClientId();
            fetch(url, {
              method: "PUT",
              headers: Object.assign(
                { "Content-Type": "application/json" },
                token ? { Authorization: "Bearer " + token } : {},
              ),
              body: JSON.stringify({ quantity: newQty }),
              signal: AbortSignal.timeout(5000),
            }).catch((err) => {
              console.error("Qty update failed:", err);
              updateCart(); // Revert on error
            });
          }

          document.querySelectorAll(".inc").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              const id = e.currentTarget.dataset.id;
              const price = parseFloat(e.currentTarget.dataset.price);
              const qtyEl = e.currentTarget.parentElement.querySelector(".qty");
              const cur = parseInt(qtyEl.textContent);
              updateQuantityOptimistic(id, cur + 1, price);
            });
          });

          document.querySelectorAll(".dec").forEach((btn) => {
            btn.addEventListener("click", async (e) => {
              const id = e.currentTarget.dataset.id;
              const price = parseFloat(e.currentTarget.dataset.price);
              const qtyEl = e.currentTarget.parentElement.querySelector(".qty");
              const cur = parseInt(qtyEl.textContent);
              if (cur <= 1) {
                const button = e.currentTarget;
                const parentDiv = button.closest("[data-item-id]");
                const confirmDel = await showModal({
                  title: "Remove item",
                  message: "Quantity is 1 — remove this item?",
                  type: "warning",
                  okText: "Remove",
                  cancelText: "Keep",
                });
                if (!confirmDel) return;
                const token = localStorage.getItem("gs_token");
                let url = "/api/cart/" + id;
                if (!token) url += "?clientId=" + getClientId();

                // Remove the item immediately so the page does not flicker.
                if (parentDiv) {
                  parentDiv.remove();
                  recalculateSummary();
                }

                try {
                  const res = await fetch(url, {
                    method: "DELETE",
                    headers: token ? { Authorization: "Bearer " + token } : {},
                    signal: AbortSignal.timeout(5000),
                  });
                  if (!res.ok) {
                    const errText = await res
                      .text()
                      .catch(() => res.statusText || "Unknown");
                    await showModal({
                      title: "Error",
                      message: "Could not remove item: " + errText,
                      type: "error",
                      okText: "OK",
                      cancelText: "Close",
                    });
                    return;
                  }
                  if (
                    document.querySelectorAll("[data-item-id]").length === 0
                  ) {
                    document.getElementById("cart-root").innerHTML =
                      '<div class="text-center py-12"><p class="text-gray-600 text-lg mb-4">Your cart is empty</p><a href="/main.html" class="text-primary font-semibold hover:underline">Start shopping</a></div>';
                    updateSummary(0, 0);
                    document
                      .getElementById("clearCart")
                      .classList.add("hidden");
                    document.getElementById("checkout").disabled = true;
                    document
                      .getElementById("checkout")
                      .classList.add("opacity-50", "cursor-not-allowed");
                  }
                } catch (err) {
                  await showModal({
                    title: "Error",
                    message: "Could not remove item: " + err.message,
                    type: "error",
                    okText: "OK",
                    cancelText: "Close",
                  });
                  updateCart();
                }
              } else {
                updateQuantityOptimistic(id, cur - 1, price);
              }
            });
          });
        } catch (err) {
          root.innerHTML =
            '<p class="text-red-600 text-center py-8">Error loading cart. Please refresh.</p>';
        }
      }

      function updateSummary(subtotal, tax) {
        document.getElementById("subtotal").textContent = "₹ " + subtotal;
        document.getElementById("tax").textContent = "₹ " + Math.round(tax);
        document.getElementById("total").textContent =
          "₹ " + Math.round(subtotal + tax);
        const snapshotTotal = document.getElementById("snapshotTotal");
        if (snapshotTotal)
          snapshotTotal.textContent = "₹ " + Math.round(subtotal + tax);
      }

      // Modal helper: shows modal and returns a Promise<boolean> based on user choice
      function showModal({
        title = "Confirm",
        message = "",
        type = "info",
        okText = "OK",
        cancelText = "Cancel",
      } = {}) {
        return new Promise((resolve) => {
          const modal = document.getElementById("globalModal");
          const titleEl = document.getElementById("modalTitle");
          const msgEl = document.getElementById("modalMessage");
          const okBtn = document.getElementById("modalOk");
          const cancelBtn = document.getElementById("modalCancel");
          const icon = document.getElementById("modalIcon");

          titleEl.textContent = title;
          msgEl.textContent = message;
          okBtn.textContent = okText;
          cancelBtn.textContent = cancelText;

          // set type/icon
          icon.className = "";
          if (type === "warning")
            icon.innerHTML =
              '<i class="bi bi-exclamation-triangle w-5 h-5 text-yellow-500"></i>';
          else if (type === "error")
            icon.innerHTML =
              '<i class="bi bi-x-circle w-5 h-5 text-red-500"></i>';
          else if (type === "success")
            icon.innerHTML =
              '<i class="bi bi-check-circle w-5 h-5 text-green-500"></i>';
          else
            icon.innerHTML =
              '<i class="bi bi-info-circle w-5 h-5 text-blue-500"></i>';

          modal.classList.remove("hidden");
          modal.setAttribute("aria-hidden", "false");

          function cleanup(choice) {
            modal.classList.add("hidden");
            modal.setAttribute("aria-hidden", "true");
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            modal.removeEventListener("click", onBackdrop);
            resolve(choice);
          }

          function onOk(e) {
            e.stopPropagation();
            cleanup(true);
          }
          function onCancel(e) {
            e.stopPropagation();
            cleanup(false);
          }
          function onBackdrop(e) {
            if (e.target === modal) cleanup(false);
          }

          okBtn.addEventListener("click", onOk);
          cancelBtn.addEventListener("click", onCancel);
          modal.addEventListener("click", onBackdrop);
        });
      }

      document.getElementById("checkout").addEventListener("click", () => {
        window.location.href = "/payment.html";
      });

      // Use modal-based confirmation for clearing cart
      document
        .getElementById("clearCart")
        .addEventListener("click", async () => {
          const confirmed = await showModal({
            title: "Clear cart",
            message: "Are you sure you want to clear all items from your cart?",
            type: "warning",
            okText: "Yes, clear",
            cancelText: "Cancel",
          });
          if (!confirmed) return;

          // Clear cart from DOM optimistically
          const root = document.getElementById("cart-root");
          root.innerHTML =
            '<div class="text-center py-12"><p class="text-gray-600 text-lg mb-4">Your cart is empty</p><a href="/main.html" class="text-primary font-semibold hover:underline">Start shopping</a></div>';
          updateSummary(0, 0);
          document.getElementById("clearCart").classList.add("hidden");
          document.getElementById("checkout").disabled = true;
          document
            .getElementById("checkout")
            .classList.add("opacity-50", "cursor-not-allowed");

          const token = localStorage.getItem("gs_token");
          try {
            // An anonymous cart is identified by the guest id, so it has to be
            // part of the request; without it the server cannot find the cart.
            const res = await fetch(session.apiUrl("/api/cart"), {
              method: "DELETE",
              headers: token ? { Authorization: "Bearer " + token } : {},
              signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) {
              const errText = await res
                .text()
                .catch(() => res.statusText || "Unknown error");
              await showModal({
                title: "Error",
                message: "Error clearing cart: " + errText,
                type: "error",
                okText: "OK",
                cancelText: "Close",
              });
              updateCart(); // Revert on error
              return;
            }
          } catch (err) {
            await showModal({
              title: "Error",
              message: "Error clearing cart: " + err.message,
              type: "error",
              okText: "OK",
              cancelText: "Close",
            });
            updateCart(); // Revert on error
          }
        });

      updateCart();

// --- Block 2 ---
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
