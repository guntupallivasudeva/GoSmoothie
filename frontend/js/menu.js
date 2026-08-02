// --- Block 1 ---
const PLACEHOLDER_IMAGE = "/assets/images/smoothie-bowl.jpg";

// --- Catalog fetch and render ---
async function loadMenu() {
  const root = document.getElementById("menuRoot");
  root.innerHTML =
    '<div class="flex justify-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("/api/products", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("Non-success status");
    const products = await res.json();

    if (!products || products.length === 0) {
      root.innerHTML =
        '<p class="text-center text-gray-500 py-20 text-lg">No products available</p>';
      return;
    }

    renderProducts(products);
  } catch (err) {
    root.innerHTML =
      '<div class="text-center py-20"><p class="text-gray-700 text-lg mb-4">Catalog unavailable</p><button onclick="loadMenu()" class="px-6 py-2 bg-primary text-white rounded-button font-medium hover:bg-green-600 transition">Retry</button></div>';
  }
}

function renderProducts(products) {
  // Group by category (case-insensitive sort ascending)
  const groups = {};
  products.forEach(function (p) {
    const cat = p.category || "Other";
    const key = cat.toLowerCase();
    if (!groups[key]) groups[key] = { title: cat, items: [] };
    groups[key].items.push(p);
  });

  const sortedKeys = Object.keys(groups).sort(function (a, b) {
    return b.localeCompare(a);
  });
  // Sort items within each group by name ascending
  sortedKeys.forEach(function (key) {
    groups[key].items.sort(function (a, b) {
      return (a.name || "").localeCompare(b.name || "");
    });
  });

  // Build category links
  const linksContainer = document.getElementById("categoryLinks");
  linksContainer.innerHTML = sortedKeys
    .map(function (key) {
      var sectionId = key.replace(/[^a-z0-9]+/g, "-");
      return (
        '<a href="#' +
        sectionId +
        '" class="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary transition text-sm font-medium">' +
        groups[key].title +
        "</a>"
      );
    })
    .join("");

  const root = document.getElementById("menuRoot");
  root.innerHTML = sortedKeys
    .map(function (key) {
      var section = groups[key];
      var sectionId = key.replace(/[^a-z0-9]+/g, "-");
      return (
        '<section id="' +
        sectionId +
        '" class="scroll-mt-28 menu-section">' +
        '<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6"><div>' +
        '<h2 class="text-3xl font-bold text-gray-900">' +
        section.title +
        "</h2>" +
        "</div></div>" +
        '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">' +
        section.items
          .map(function (item) {
            return renderCard(item, section.title);
          })
          .join("") +
        "</div></section>"
      );
    })
    .join("");

  attachCardHandlers();
  applyMenuFilter();
  syncMenuCards();
}

function renderCard(item, categoryTitle) {
  var imgSrc = item.image || PLACEHOLDER_IMAGE;
  var meta = item.meta || {};
  var type = item.type || "Vegetarian";
  var typeLower = type.toLowerCase();

  return (
    '<article class="menu-card bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 flex flex-col' +
    (item.isOutOfStock
      ? " opacity-60 border-l-4 border-red-400"
      : " hover:-translate-y-2") +
    '" data-product-id="' +
    (item.productId || "") +
    '" data-name="' +
    escapeHtml(item.name) +
    '" data-price="' +
    item.price +
    '" data-image="' +
    escapeHtml(item.image || "") +
    '" data-type="' +
    typeLower +
    '">' +
    '<div class="relative aspect-square overflow-hidden">' +
    '<img src="' +
    escapeHtml(imgSrc) +
    '" alt="' +
    escapeHtml(item.name) +
    '" class="absolute inset-0 w-full h-full object-cover" onerror="handleImgError(this)">' +
    (item.isOutOfStock
      ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center"><span class="text-white font-bold text-lg">Out of Stock</span></div>'
      : "") +
    '<div class="nutrition-panel absolute inset-0 bg-black/75 p-5 text-white flex flex-col justify-center">' +
    '<h3 class="font-bold mb-3 text-center">Nutrition Info</h3>' +
    '<ul class="space-y-1 text-sm">' +
    '<li class="flex justify-between gap-3"><span>Calories</span><span class="font-semibold">' +
    (meta.calories != null ? meta.calories + " kcal" : "\u2014") +
    "</span></li>" +
    '<li class="flex justify-between gap-3"><span>Protein</span><span class="font-semibold">' +
    (meta.protein != null ? meta.protein + " g" : "\u2014") +
    "</span></li>" +
    '<li class="flex justify-between gap-3"><span>Carbs</span><span class="font-semibold">' +
    (meta.carbs != null ? meta.carbs + " g" : "\u2014") +
    "</span></li>" +
    '<li class="flex justify-between gap-3"><span>Fat</span><span class="font-semibold">' +
    (meta.fat != null ? meta.fat + " g" : "\u2014") +
    "</span></li>" +
    '<li class="flex justify-between gap-3"><span>Fiber</span><span class="font-semibold">' +
    (meta.fiber != null ? meta.fiber + " g" : "\u2014") +
    "</span></li>" +
    '<li class="flex justify-between gap-3"><span>Sugar</span><span class="font-semibold">' +
    (meta.sugar != null ? meta.sugar + " g" : "\u2014") +
    "</span></li>" +
    "</ul></div></div>" +
    '<div class="p-4 flex flex-col flex-1">' +
    '<div class="flex items-start gap-2 mb-1">' +
    '<div class="flex items-start gap-1.5 flex-1 min-w-0">' +
    (typeLower === "vegetarian" || typeLower === "vegan"
      ? '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-green-600 flex items-center justify-center mt-0.5" title="Vegetarian"><span class="w-2 h-2 rounded-full bg-green-600"></span></span>'
      : '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-red-600 flex items-center justify-center mt-0.5" title="Non-Vegetarian"><span class="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-600"></span></span>') +
    '<h3 class="text-sm font-bold text-gray-900 leading-snug">' +
    escapeHtml(item.name) +
    "</h3></div>" +
    '<span class="text-sm font-bold text-primary whitespace-nowrap shrink-0">Rs ' +
    item.price +
    "</span></div>" +
    '<p class="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed flex-1">' +
    escapeHtml(item.description || "") +
    "</p>" +
    (item.isOutOfStock
      ? '<div class="flex items-center justify-center py-3 mt-auto"><span class="px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-xs ring-1 ring-red-100">Out of Stock</span></div>'
      : '<div class="grid grid-cols-2 gap-2 mt-auto">' +
        '<div class="flex items-center justify-center border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">' +
        '<button class="qty-dec flex-1 py-2 text-gray-600 hover:bg-gray-100 transition"><i class="bi bi-dash"></i></button>' +
        '<input type="number" min="1" value="1" class="qty-input w-10 text-center text-sm font-semibold bg-transparent border-none focus:outline-none">' +
        '<button class="qty-inc flex-1 py-2 text-gray-600 hover:bg-gray-100 transition"><i class="bi bi-plus"></i></button>' +
        "</div>" +
        '<button class="add-to-cart bg-primary text-white py-2 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap hover:bg-green-600 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5"><i class="bi bi-cart-plus text-sm"></i> Add</button>' +
        "</div>") +
    "</div></article>"
  );
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function handleImgError(img) {
  if (img.src.indexOf(PLACEHOLDER_IMAGE) === -1) {
    img.onerror = function () {
      // Placeholder itself failed - stop retrying, show alt text
      this.onerror = null;
      this.style.display = "none";
      var alt = document.createElement("div");
      alt.className =
        "w-full h-full flex items-center justify-center text-gray-600 font-medium text-center p-4";
      alt.textContent = this.alt;
      this.parentNode.insertBefore(alt, this);
    };
    img.src = PLACEHOLDER_IMAGE;
  } else {
    // Placeholder itself failed
    img.onerror = null;
    img.style.display = "none";
    var alt = document.createElement("div");
    alt.className =
      "w-full h-full flex items-center justify-center text-gray-600 font-medium text-center p-4";
    alt.textContent = img.alt;
    img.parentNode.insertBefore(alt, img);
  }
}

// Session state lives in session.js so every page agrees on who is signed in.
const session = window.GoSmoothieSession;
function getToken() {
  return session.getToken();
}
function getClientId() {
  return session.getClientId();
}
function authHeaders() {
  return session.authHeaders();
}
function updateUserMenu() {
  session.renderAuthHeader();
}

function updateCartCount() {
  const badge = document.getElementById("cartBtn").querySelector("span");
  const token = getToken();
  let url = "/api/cart";
  if (!token) url += "?clientId=" + getClientId();
  fetch(url, { headers: authHeaders() })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const count =
        data && data.items
          ? data.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
          : 0;
      if (badge) badge.textContent = count;
    })
    .catch(() => {});
}

function cartUrl(path = "") {
  const token = getToken();
  return (
    "/api/cart" +
    path +
    (token ? "" : "?clientId=" + encodeURIComponent(getClientId()))
  );
}

async function fetchMenuCart() {
  const res = await fetch(cartUrl(), {
    headers: authHeaders(),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("Failed to load cart");
  return res.json();
}

function setMenuCardState(card, item) {
  const button = card.querySelector(".add-to-cart");
  const input = card.querySelector(".qty-input");
  if (!button || !input) return; // Out of stock cards have no cart controls
  if (item) {
    button.dataset.inCart = "1";
    button.dataset.cartId = item.cartId || item.id;
    button.innerHTML = '<i class="bi bi-cart-dash text-lg"></i>';
    button.classList.remove("bg-primary", "hover:bg-green-600");
    button.classList.add("bg-red-500", "hover:bg-red-600");
    input.value = item.quantity || 1;
  } else {
    button.dataset.inCart = "0";
    delete button.dataset.cartId;
    button.innerHTML = '<i class="bi bi-cart-plus text-lg"></i>';
    button.classList.remove("bg-red-500", "hover:bg-red-600");
    button.classList.add("bg-primary", "hover:bg-green-600");
    input.value = 1;
  }
}

async function syncMenuCards() {
  try {
    const cart = await fetchMenuCart();
    document.querySelectorAll(".menu-card").forEach((card) => {
      const productId = card.dataset.productId || "";
      const item = (cart.items || []).find(
        (entry) =>
          (productId && entry.productId === productId) ||
          (!productId && entry.name === card.dataset.name),
      );
      setMenuCardState(card, item);
    });
  } catch (err) {
    console.error(err);
  }
}

function applyMenuFilter() {
  const filter = document.getElementById("vegFilter").value;
  document.querySelectorAll(".menu-section").forEach((section) => {
    let visibleCards = 0;
    section.querySelectorAll(".menu-card").forEach((card) => {
      const matches = filter === "all" || card.dataset.type === filter;
      card.style.display = matches ? "" : "none";
      if (matches) visibleCards += 1;
    });
    section.style.display = visibleCards > 0 ? "" : "none";
  });
}

// Toast notifications are provided by the shared /js/toast.js service

// Modal helper: shows modal and returns a Promise<boolean> based on user choice
function showModalMenu({
  title = "Confirm",
  message = "",
  type = "info",
  okText = "OK",
  cancelText = "Cancel",
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("globalModalMenu");
    const titleEl = document.getElementById("modalTitleMenu");
    const msgEl = document.getElementById("modalMessageMenu");
    const okBtn = document.getElementById("modalOkMenu");
    const cancelBtn = document.getElementById("modalCancelMenu");
    const icon = document.getElementById("modalIconMenu");

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;

    icon.className = "";
    if (type === "warning")
      icon.innerHTML =
        '<i class="bi bi-exclamation-triangle text-yellow-500"></i>';
    else if (type === "error")
      icon.innerHTML = '<i class="bi bi-x-circle text-red-500"></i>';
    else if (type === "success")
      icon.innerHTML = '<i class="bi bi-check-circle text-green-500"></i>';
    else icon.innerHTML = '<i class="bi bi-info-circle text-blue-500"></i>';

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

function attachCardHandlers() {
  document.querySelectorAll(".menu-card").forEach((card) => {
    const dec = card.querySelector(".qty-dec");
    const inc = card.querySelector(".qty-inc");
    const input = card.querySelector(".qty-input");
    const addBtn = card.querySelector(".add-to-cart");

    // Skip out-of-stock cards (no cart controls)
    if (!addBtn || !input) return;

    const changeQuantity = async (nextQuantity) => {
      input.value = Math.max(1, parseInt(nextQuantity, 10) || 1);
      if (addBtn.dataset.inCart !== "1" || !addBtn.dataset.cartId) return;
      try {
        const res = await fetch(cartUrl("/" + addBtn.dataset.cartId), {
          method: "PUT",
          headers: Object.assign(
            { "Content-Type": "application/json" },
            authHeaders(),
          ),
          body: JSON.stringify({ quantity: parseInt(input.value, 10) }),
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("Quantity update failed");
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        showToast(err.message, "error");
        syncMenuCards();
      }
    };

    dec.addEventListener("click", () =>
      changeQuantity(parseInt(input.value || 1, 10) - 1),
    );
    inc.addEventListener("click", () =>
      changeQuantity(parseInt(input.value || 1, 10) + 1),
    );
    input.addEventListener("change", () => changeQuantity(input.value));
    addBtn.addEventListener("click", async () => {
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price) || 0;
      const productId = card.dataset.productId || "";
      const image = card.dataset.image || "";
      const qty = parseInt(input.value || 1);
      const body = { productId, name, price, image, quantity: qty };
      const token = getToken();
      if (!token) body.clientId = getClientId();

      if (addBtn.dataset.inCart === "1") {
        // Remove from cart
        try {
          const itemId = addBtn.dataset.cartId;
          if (itemId) {
            const delRes = await fetch(cartUrl("/" + itemId), {
              method: "DELETE",
              headers: authHeaders(),
              signal: AbortSignal.timeout(5000),
            });
            if (delRes.ok) {
              setMenuCardState(card, null);
              showToast("Item removed from cart", "success");
              window.dispatchEvent(new Event("cartUpdated"));
            } else {
              showToast("Failed to remove item", "error");
            }
          }
        } catch (err) {
          showToast("Network error: " + err.message, "error");
        }
      } else {
        // Add to cart
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: Object.assign(
              { "Content-Type": "application/json" },
              authHeaders(),
            ),
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
          });
          if (res.ok) {
            const cart = await res.json();
            const item = (cart.items || []).find(
              (entry) =>
                (productId && entry.productId === productId) ||
                (!productId && entry.name === name),
            );
            setMenuCardState(card, item);
            showToast("Added to cart!", "success");
            window.dispatchEvent(new Event("cartUpdated"));
          } else {
            const err = await res.json();
            showToast(err.error || "Failed to add to cart", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error: " + err.message, "error");
        }
      }
    });
  });
}

document.getElementById("cartBtn").addEventListener("click", () => {
  window.location.href = "/cart.html";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  const confirmed = await showModalMenu({
    title: "Logout",
    message: "Are you sure you want to logout?",
    type: "warning",
    okText: "Yes, logout",
    cancelText: "Cancel",
  });
  if (confirmed) {
    session.logout("/main.html");
  }
});

document
  .getElementById("vegFilter")
  .addEventListener("change", applyMenuFilter);

window.addEventListener("cartUpdated", () => {
  updateCartCount();
  updateUserMenu();
  syncMenuCards();
});

loadMenu();
updateUserMenu();
updateCartCount();
