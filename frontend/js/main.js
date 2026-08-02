// --- Block 1 ---
let productsCache = null;

function sortFeaturedProducts(products) {
  return products.slice().sort((a, b) => {
    const aOrder = a.featuredOrder;
    const bOrder = b.featuredOrder;
    // Nulls last
    if (aOrder == null && bOrder == null)
      return (a.name || "").localeCompare(b.name || "");
    if (aOrder == null) return 1;
    if (bOrder == null) return -1;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.name || "").localeCompare(b.name || "");
  });
}

async function loadProducts() {
  const container = document.getElementById("productsGrid");
  if (productsCache) {
    renderProducts(productsCache);
    return;
  }
  try {
    const res = await fetch("/api/products?featured=true", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("Failed to load products");
    const data = await res.json();
    productsCache = sortFeaturedProducts(Array.isArray(data) ? data : []);
    renderProducts(productsCache);
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="col-span-full text-red-500">Failed to load products</div>';
  }
}

function renderProducts(products) {
  const container = document.getElementById("productsGrid");
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const PLACEHOLDER = "/assets/images/smoothie-bowl.jpg";

  products.forEach((p) => {
    const imgSrc = p.featuredImage || p.image || PLACEHOLDER;
    const typeLower = (p.type || "Vegetarian").toLowerCase();
    const vegIcon =
      typeLower === "vegetarian" || typeLower === "vegan"
        ? '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-green-600 flex items-center justify-center mt-0.5" title="Vegetarian"><span class="w-2 h-2 rounded-full bg-green-600"></span></span>'
        : '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-red-600 flex items-center justify-center mt-0.5" title="Non-Vegetarian"><span class="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-600"></span></span>';
    const card = document.createElement("div");
    card.className =
      "smoothie-card bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-300 flex flex-col" +
      (p.isOutOfStock
        ? " opacity-60 border-l-4 border-red-400"
        : " hover:-translate-y-2");
    card.dataset.productName = p.name;
    card.dataset.productPrice = p.price;
    card.dataset.productId = p.productId || "";
    card.dataset.productImage = p.image || "";
    card.innerHTML = `
        <div class="relative h-64 bg-white">
          <img src="${imgSrc}" alt="${p.name || ""}" class="w-full h-full object-contain" onerror="this.onerror=function(){this.onerror=null;this.style.display='none';this.parentElement.querySelector('.img-alt-text').style.display='flex';};this.src='${PLACEHOLDER}';" >
          ${p.isOutOfStock ? '<div class="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><span class="text-white font-bold text-lg">Out of Stock</span></div>' : ""}
          <div class="img-alt-text absolute inset-0 bg-gray-200 items-center justify-center text-gray-600 font-medium text-center p-4" style="display:none;">${p.name || ""}</div>
          <div class="nutritional-info absolute inset-0 bg-black bg-opacity-75 p-4 flex flex-col justify-center text-white overflow-y-auto">
            <h3 class="font-bold mb-3 text-center">Nutrition Info</h3>
            <ul class="text-md space-y-1">
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Calories:</span><span class="font-semibold text-right">${(p.meta && p.meta.calories) || "-"} kcal</span></li>
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Protein:</span><span class="font-semibold text-right">${(p.meta && p.meta.protein) || "-"} g</span></li>
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Carbs:</span><span class="font-semibold text-right">${(p.meta && p.meta.carbs) || "-"} g</span></li>
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Fat:</span><span class="font-semibold text-right">${(p.meta && p.meta.fat) || "-"} g</span></li>
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Fiber:</span><span class="font-semibold text-right">${(p.meta && p.meta.fiber) || "-"} g</span></li>
              <li class="grid grid-cols-[1fr_auto] items-center gap-3"><span>Sugar:</span><span class="font-semibold text-right">${(p.meta && p.meta.sugar) || "-"} g</span></li>
            </ul>
          </div>
        </div>
        <div class="p-4 flex flex-col flex-1">
          <div class="flex items-start gap-2 mb-1">
            <div class="flex items-start gap-1.5 flex-1 min-w-0">
              ${vegIcon}
              <h3 class="text-sm font-bold text-gray-900 leading-snug">${p.name}</h3>
            </div>
            <span class="text-sm font-bold text-primary whitespace-nowrap shrink-0">Rs ${p.price}</span>
          </div>
          <p class="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed flex-1">${p.description || ""}</p>
          ${
            p.isOutOfStock
              ? '<div class="flex items-center justify-center py-3 mt-auto"><span class="px-4 py-2 rounded-full bg-red-50 text-red-600 font-bold text-xs ring-1 ring-red-100">Out of Stock</span></div>'
              : `<div class="grid grid-cols-2 gap-2 mt-auto">
              <div class="flex items-center justify-center border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                <button class="qty-dec flex-1 py-2 text-gray-600 hover:bg-gray-100 transition"><i class="bi bi-dash"></i></button>
                <input type="number" min="1" value="1" class="qty-input w-10 text-center text-sm font-semibold bg-transparent border-none focus:outline-none" />
                <button class="qty-inc flex-1 py-2 text-gray-600 hover:bg-gray-100 transition"><i class="bi bi-plus"></i></button>
              </div>
              <button class="add-to-cart bg-primary text-white py-2 px-3 rounded-2xl text-xs font-semibold whitespace-nowrap hover:bg-green-600 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5"><i class="bi bi-cart-plus text-sm"></i> Add</button>
            </div>`
          }
        </div>
      `;
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  attachProductHandlers();
  syncProductButtons();
}

function attachProductHandlers() {
  document.querySelectorAll(".smoothie-card").forEach((card) => {
    const dec = card.querySelector(".qty-dec");
    const inc = card.querySelector(".qty-inc");
    const input = card.querySelector(".qty-input");
    const addBtn = card.querySelector(".add-to-cart");

    // Skip out-of-stock cards (no cart controls)
    if (!addBtn || !input) return;

    const changeQuantity = async (nextQuantity) => {
      input.value = Math.max(1, parseInt(nextQuantity, 10) || 1);
      if (addBtn.dataset.inCart !== "1" || !addBtn.dataset.cartId) return;
      const token = GoSmoothieSession.getToken();
      // apiUrl() appends the guest cart id only while signed out, and creates
      // one if this is the visitor's first cart action.
      const url = GoSmoothieSession.apiUrl(
        "/api/cart/" + addBtn.dataset.cartId,
      );
      try {
        const res = await fetch(url, {
          method: "PUT",
          headers: Object.assign(
            { "Content-Type": "application/json" },
            token ? { Authorization: "Bearer " + token } : {},
          ),
          body: JSON.stringify({
            quantity: parseInt(input.value, 10),
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("Quantity update failed");
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        showToast(err.message, "error");
        await syncProductButtons();
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
      const qty = parseInt(input.value || 1);
      const token = localStorage.getItem("gs_token");
      const name = card.dataset.productName || "Product";
      const price = parseFloat(card.dataset.productPrice) || 0;
      const productId = card.dataset.productId || "";
      const image = card.dataset.productImage || "";

      // if already in cart -> remove
      if (addBtn.dataset.inCart === "1") {
        let itemId = addBtn.dataset.cartId;
        try {
          if (!itemId) {
            const cart = await fetchCartMain();
            const found =
              cart &&
              cart.items &&
              cart.items.find(
                (i) =>
                  (productId && i.productId === productId) ||
                  (!productId &&
                    i.name === name &&
                    parseFloat(i.price) === price),
              );
            itemId = found && (found.cartId || found.id);
          }
          if (!itemId) return;
          const url = GoSmoothieSession.apiUrl("/api/cart/" + itemId);
          const res = await fetch(url, {
            method: "DELETE",
            headers: token ? { Authorization: "Bearer " + token } : {},
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) {
            const errText = await res.text().catch(() => res.statusText);
            showToast("Remove failed: " + errText, "error");
            return;
          }
          showToast(name + " removed from cart!");
          window.dispatchEvent(new Event("cartUpdated"));
        } catch (err) {
          console.error(err);
          showToast("Network error: " + err.message, "error");
        }
        return;
      }

      // withClientId() adds the guest cart id only while signed out.
      const body = GoSmoothieSession.withClientId({
        productId,
        name,
        price,
        image,
        quantity: qty,
      });

      const headers = Object.assign(
        { "Content-Type": "application/json" },
        token ? { Authorization: "Bearer " + token } : {},
      );
      try {
        const r = await fetch("/api/cart", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(5000),
        });
        if (r.ok) {
          const cart = await r.json();
          const item =
            cart.items &&
            cart.items.find(
              (i) =>
                (productId && i.productId === productId) ||
                (!productId &&
                  i.name === name &&
                  parseFloat(i.price) === price),
            );
          if (item) {
            addBtn.dataset.inCart = "1";
            addBtn.dataset.cartId = item.cartId || item.id;
            input.value = item.quantity || qty;
            addBtn.innerHTML = '<i class="bi bi-cart-dash text-lg"></i>';
            addBtn.classList.remove("bg-primary", "hover:bg-green-600");
            addBtn.classList.add("bg-red-500", "hover:bg-red-600");
          }
          showToast(name + " added to cart!");
          window.dispatchEvent(new Event("cartUpdated"));
        } else {
          const err = await r.json();
          showToast(err.error || "Failed to add to cart", "error");
        }
      } catch (err) {
        console.error("Cart error:", err);
        showToast("Network error: " + err.message, "error");
      }
    });
  });
}

async function fetchCartMain() {
  const url = GoSmoothieSession.apiUrl("/api/cart");
  try {
    const r = await fetch(url, {
      headers: GoSmoothieSession.authHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) return await r.json();
  } catch (e) {}
  return null;
}

async function syncProductButtons() {
  const cart = await fetchCartMain();
  document.querySelectorAll(".smoothie-card").forEach((card) => {
    const name = card.dataset.productName;
    const price = parseFloat(card.dataset.productPrice) || 0;
    const productId = card.dataset.productId || "";
    const addBtn = card.querySelector(".add-to-cart");
    if (!addBtn) return;
    const found =
      cart &&
      cart.items &&
      cart.items.find(
        (i) =>
          (productId && i.productId === productId) ||
          (!productId && i.name === name && parseFloat(i.price) === price),
      );
    const input = card.querySelector(".qty-input");
    if (found) {
      addBtn.dataset.inCart = "1";
      addBtn.dataset.cartId = found.cartId || found.id;
      if (input) input.value = found.quantity || 1;
      addBtn.innerHTML = '<i class="bi bi-cart-dash text-lg"></i>';
      addBtn.classList.remove("bg-primary", "hover:bg-green-600");
      addBtn.classList.add("bg-red-500", "hover:bg-red-600");
    } else {
      addBtn.dataset.inCart = "0";
      delete addBtn.dataset.cartId;
      if (input) input.value = 1;
      addBtn.innerHTML = '<i class="bi bi-cart-plus text-lg"></i>';
      addBtn.classList.remove("bg-red-500", "hover:bg-red-600");
      addBtn.classList.add("bg-primary", "hover:bg-green-600");
    }
  });
}
// Toast notifications are provided by the shared /js/toast.js service

window.addEventListener("cartUpdated", syncProductButtons);
syncProductButtons();

// Handle seasonal specials add to cart buttons
function attachSeasonalSpecialsHandlers() {
  document
    .querySelectorAll("[data-product-name][data-product-price]")
    .forEach((card) => {
      if (card.classList.contains("smoothie-card")) return; // Skip if already handled by smoothie-card handler
      const addBtn = card.querySelector(".add-to-cart");
      if (!addBtn) return;

      addBtn.addEventListener("click", async () => {
        const token = localStorage.getItem("gs_token");
        const name = card.dataset.productName;
        const price = parseFloat(card.dataset.productPrice);
        const qty = 1;

        const body = GoSmoothieSession.withClientId({
          name,
          price,
          quantity: qty,
        });

        const headers = Object.assign(
          { "Content-Type": "application/json" },
          token ? { Authorization: "Bearer " + token } : {},
        );
        try {
          const r = await fetch("/api/cart", {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
          });
          if (r.ok) {
            addBtn.innerHTML = '<i class="bi bi-check-lg text-lg"></i>';
            setTimeout(
              () =>
                (addBtn.innerHTML = '<i class="bi bi-cart-plus text-lg"></i>'),
              1200,
            );
            // Update cart count
            try {
              const evt = new Event("cartUpdated");
              window.dispatchEvent(evt);
            } catch (e) {}
          } else {
            const err = await r.json();
            showToast(err.error || "Failed to add to cart", "error");
          }
        } catch (err) {
          console.error("Cart error:", err);
          showToast("Network error: " + err.message, "error");
        }
      });
    });
}

// Load products on page load or when section comes into view
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    loadProducts();
    attachSeasonalSpecialsHandlers();
  });
} else {
  loadProducts();
  attachSeasonalSpecialsHandlers();
}

// --- Block 2 ---
document.addEventListener("DOMContentLoaded", function () {
  // Builder UI state tracking
  const builderState = {
    base: null,
    fruits: [],
    boosters: [],
    size: null,
  };

  // Update builder summary when selections change
  function syncBuilderPreview() {
    const baseInput = document.querySelector('input[name="base"]:checked');
    const sizeInput = document.querySelector('input[name="size"]:checked');
    const fruitInputs = Array.from(
      document.querySelectorAll('input[name="fruits"]:checked'),
    ).map((i) => i.value);
    const boosterInputs = Array.from(
      document.querySelectorAll('input[name="boosters"]:checked'),
    ).map((i) => i.value);

    builderState.base = baseInput?.value || null;
    builderState.size = sizeInput?.value || null;
    builderState.fruits = fruitInputs;
    builderState.boosters = boosterInputs;

    // Update summary display
    const fruitsSummary =
      fruitInputs.length > 0
        ? fruitInputs
            .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
            .join(", ")
        : "None";
    const boostersSummary =
      boosterInputs.length > 0
        ? boosterInputs
            .map((b) => b.charAt(0).toUpperCase() + b.slice(1))
            .join(", ")
        : "None";

    document.querySelectorAll(".builder-summary").forEach((el) => {
      if (el.dataset.type === "base") {
        // prefer the human-readable label text if present (e.g. "Almond Milk")
        let baseDisplay = "-";
        if (baseInput) {
          const lbl = baseInput.closest("label");
          baseDisplay =
            (lbl &&
              lbl.querySelector("span") &&
              lbl.querySelector("span").textContent.trim()) ||
            (builderState.base
              ? builderState.base.charAt(0).toUpperCase() +
                builderState.base.slice(1)
              : "-");
        } else if (builderState.base) {
          baseDisplay =
            builderState.base.charAt(0).toUpperCase() +
            builderState.base.slice(1);
        }
        el.textContent = baseDisplay || "-";
        try {
          el.style.color = "#0f172a";
        } catch (e) {}
      }
      if (el.dataset.type === "fruits") {
        el.textContent = fruitsSummary || "None";
        try {
          el.style.color = "#0f172a";
        } catch (e) {}
      }
      if (el.dataset.type === "boosters") {
        el.textContent = boostersSummary || "None";
        try {
          el.style.color = "#0f172a";
        } catch (e) {}
      }
      if (el.dataset.type === "size") {
        el.textContent = builderState.size
          ? builderState.size.charAt(0).toUpperCase() +
            builderState.size.slice(1) +
            " (16-24 oz)"
          : "-";
        try {
          el.style.color = "#0f172a";
        } catch (e) {}
      }
    });

    // debug: show current state
    try {
      console.debug(
        "syncBuilderPreview",
        JSON.parse(JSON.stringify(builderState)),
      );
    } catch (e) {}

    updateNutritionDisplay();
  }

  // Add UI color changes on selection
  document
    .querySelectorAll('.base-option input[type="radio"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".base-option").forEach((l) => {
          l.classList.remove("border-primary", "bg-primary/5");
          l.classList.add("border-gray-200");
        });
        input.closest(".base-option").classList.remove("border-gray-200");
        input
          .closest(".base-option")
          .classList.add("border-primary", "bg-primary/5");
        syncBuilderPreview();
      });
    });

  document
    .querySelectorAll('.size-option input[type="radio"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".size-option").forEach((l) => {
          l.classList.remove("border-primary", "bg-primary/5");
          l.classList.add("border-gray-200");
        });
        input.closest(".size-option").classList.remove("border-gray-200");
        input
          .closest(".size-option")
          .classList.add("border-primary", "bg-primary/5");
        syncBuilderPreview();
      });
    });

  document.querySelectorAll('input[name="fruits"]').forEach((input) => {
    input.addEventListener("change", function () {
      // Enforce maximum 3 fruits selection
      const checkedFruits = Array.from(
        document.querySelectorAll('input[name="fruits"]:checked'),
      );
      const label = this.closest(".fruit-option");
      if (this.checked && checkedFruits.length > 3) {
        // revert the latest check and give a visual hint
        this.checked = false;
        label.classList.add("ring-2", "ring-red-400");
        setTimeout(() => label.classList.remove("ring-2", "ring-red-400"), 700);
        console.warn("Maximum 3 fruits allowed.");
        return syncBuilderPreview();
      }

      if (this.checked) {
        label.classList.add("border-primary", "bg-primary/10");
      } else {
        label.classList.remove("border-primary", "bg-primary/10");
      }
      syncBuilderPreview();
    });
  });

  document.querySelectorAll('input[name="boosters"]').forEach((input) => {
    input.addEventListener("change", function () {
      const label = this.closest(".booster-option");
      if (this.checked) {
        label.classList.add("border-primary", "bg-primary/10");
      } else {
        label.classList.remove("border-primary", "bg-primary/10");
      }
      syncBuilderPreview();
    });
  });

  // Quantity controls removed (handled as fixed single item)

  // Nutrition data for bases and fruits
  const nutritionData = {
    base: {
      almond: {
        calories: 30,
        protein: 1,
        carbs: 1,
        fat: 3,
        fiber: 0,
        sugar: 0,
      },
      coconut: {
        calories: 45,
        protein: 0,
        carbs: 9,
        fat: 0,
        fiber: 0,
        sugar: 7,
      },
      yogurt: {
        calories: 60,
        protein: 8,
        carbs: 5,
        fat: 2,
        fiber: 0,
        sugar: 4,
      },
      oat: {
        calories: 40,
        protein: 2,
        carbs: 7,
        fat: 1,
        fiber: 2,
        sugar: 0,
      },
      juice: {
        calories: 50,
        protein: 1,
        carbs: 12,
        fat: 0,
        fiber: 1,
        sugar: 11,
      },
      water: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
    },
    fruit: {
      strawberry: {
        calories: 30,
        protein: 0.6,
        carbs: 7,
        fat: 0,
        fiber: 2,
        sugar: 4,
      },
      banana: {
        calories: 88,
        protein: 1,
        carbs: 23,
        fat: 0,
        fiber: 3,
        sugar: 12,
      },
      blueberry: {
        calories: 55,
        protein: 0.7,
        carbs: 14,
        fat: 0,
        fiber: 2,
        sugar: 10,
      },
      mango: {
        calories: 60,
        protein: 0.8,
        carbs: 15,
        fat: 0,
        fiber: 1.5,
        sugar: 13,
      },
      pineapple: {
        calories: 42,
        protein: 0.5,
        carbs: 11,
        fat: 0,
        fiber: 1.2,
        sugar: 9,
      },
      kiwi: {
        calories: 61,
        protein: 1.2,
        carbs: 15,
        fat: 0.5,
        fiber: 3,
        sugar: 6,
      },
      peach: {
        calories: 39,
        protein: 0.9,
        carbs: 10,
        fat: 0,
        fiber: 1.5,
        sugar: 8,
      },
      raspberry: {
        calories: 52,
        protein: 1.2,
        carbs: 12,
        fat: 0.6,
        fiber: 6,
        sugar: 4,
      },
    },
  };

  const boosterPrices = {
    protein: 50,
    chia: 80,
    flax: 75,
    spinach: 100,
    collagen: 180,
    acai: 130,
  };

  // Calculate nutrition and price from selections
  function calculateNutrition() {
    const base = builderState.base;
    const fruits = builderState.fruits || [];
    const boosters = builderState.boosters || [];

    let nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    };

    // Add base nutrition
    if (nutritionData.base[base]) {
      Object.keys(nutrition).forEach(
        (k) => (nutrition[k] += nutritionData.base[base][k]),
      );
    }

    // Add fruit nutrition
    fruits.forEach((f) => {
      if (nutritionData.fruit[f]) {
        Object.keys(nutrition).forEach(
          (k) => (nutrition[k] += nutritionData.fruit[f][k]),
        );
      }
    });

    // Boosters add minimal calories but increase protein
    boosters.forEach((b) => {
      if (b === "protein") nutrition.protein += 20;
      if (b === "chia") {
        nutrition.calories += 30;
        nutrition.fiber += 3;
      }
      if (b === "flax") {
        nutrition.calories += 25;
        nutrition.fiber += 2;
      }
      if (b === "spinach") {
        nutrition.calories += 5;
        nutrition.protein += 0.5;
        nutrition.fiber += 0.5;
      }
      if (b === "collagen") nutrition.protein += 10;
      if (b === "acai") {
        nutrition.calories += 45;
        nutrition.carbs += 9;
      }
    });

    return nutrition;
  }

  function calculatePrice() {
    const boosterCost = (builderState.boosters || []).reduce(
      (sum, b) => sum + (boosterPrices[b] || 0),
      0,
    );
    const sizePrice = builderState.size
      ? { small: 80, medium: 130, large: 180 }[builderState.size] || 0
      : 0;
    return sizePrice + boosterCost;
  }

  // Update nutrition info in builder summary
  function updateNutritionDisplay() {
    const nutrition = calculateNutrition();
    const price = calculatePrice();

    document.querySelectorAll("[data-nutrition]").forEach((el) => {
      const type = el.dataset.nutrition;
      el.textContent = Math.round(nutrition[type] || 0);
    });

    const priceEl = document.querySelector("[data-price]");
    if (priceEl) priceEl.textContent = price;
  }

  // Quantity inputs and delegated handlers removed

  // Initial update
  syncBuilderPreview();

  // Builder add to cart
  const builderAddBtn = document.getElementById("builderAddToCart");
  if (builderAddBtn)
    builderAddBtn.addEventListener("click", async () => {
      const qty = 1;
      const token = localStorage.getItem("gs_token");
      const size = builderState.size;
      const price = calculatePrice();

      if (!builderState.base || !size) {
        showToast(
          "Please select a base and size before adding your custom smoothie to the cart.",
          "warning",
        );
        return;
      }

      const instructions =
        (document.getElementById("builderInstructions") &&
          document.getElementById("builderInstructions").value) ||
        "";
      const body = {
        name:
          "Custom Smoothie (" +
          size.charAt(0).toUpperCase() +
          size.slice(1) +
          ")",
        price: price,
        quantity: qty,
        instructions: instructions,
      };

      if (!token) {
        body.clientId =
          localStorage.getItem("gs_clientId") ||
          "c_" + Date.now() + Math.random().toString(36).slice(2, 9);
      }

      const headers = Object.assign(
        { "Content-Type": "application/json" },
        token ? { Authorization: "Bearer " + token } : {},
      );

      try {
        const r = await fetch("/api/cart", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (r.ok) {
          const btn = document.getElementById("builderAddToCart");
          btn.textContent = "Added!";
          setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
        } else {
          const err = await r.json();
          showToast(err.error || "Add failed", "error");
        }
        // Update header cart count
        try {
          const evt = new Event("cartUpdated");
          window.dispatchEvent(evt);
        } catch (e) {}
      } catch (e) {
        showToast("Error: " + e.message, "error");
      }
    });

  // Handle user menu and logout
  function updateUserMenu() {
    const token = localStorage.getItem("gs_token");
    const user = token
      ? JSON.parse(localStorage.getItem("gs_user") || "{}")
      : null;
    const authLinks = document.getElementById("authLinks");
    const userMenu = document.getElementById("userMenu");
    const userMenuBtn = document.getElementById("userMenuBtn");
    const userMenuDropdown = document.getElementById("userMenuDropdown");
    const userNameEl = document.getElementById("userName");

    if (token && user) {
      authLinks.style.display = "none";
      userMenu.classList.remove("hidden");
      const displayName =
        (user.name && user.name.trim().split(" ")[0]) ||
        (user.email && user.email.split("@")[0]) ||
        "Profile";
      if (userNameEl) userNameEl.textContent = displayName;

      let closeTimer;
      const openMenu = () => {
        clearTimeout(closeTimer);
        userMenuDropdown.classList.remove(
          "opacity-0",
          "invisible",
          "pointer-events-none",
          "translate-y-1",
        );
        userMenuDropdown.classList.add(
          "opacity-100",
          "visible",
          "pointer-events-auto",
          "translate-y-0",
        );
      };
      const closeMenu = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          userMenuDropdown.classList.add(
            "opacity-0",
            "invisible",
            "pointer-events-none",
            "translate-y-1",
          );
          userMenuDropdown.classList.remove(
            "opacity-100",
            "visible",
            "pointer-events-auto",
            "translate-y-0",
          );
        }, 180);
      };

      userMenuBtn.onclick = () => {
        const session = new URLSearchParams({
          gs_token: token,
          gs_user: JSON.stringify(user),
        });
        const appBase =
          ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
          window.location.port !== "3000"
            ? `http://${window.location.hostname}:3000`
            : "";
        window.location.href = `${appBase}/profile.html#${session.toString()}`;
      };
      userMenu.onmouseenter = openMenu;
      userMenu.onmouseleave = closeMenu;
      userMenuDropdown.onmouseenter = openMenu;
      userMenuDropdown.onmouseleave = closeMenu;
    } else {
      authLinks.style.display = "flex";
      userMenu.classList.add("hidden");
    }
  }

  const logoutModal = document.getElementById("logoutModal");
  const closeLogoutModal = () => {
    logoutModal.classList.add("hidden");
    logoutModal.classList.remove("flex");
    logoutModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  const openLogoutModal = () => {
    logoutModal.classList.remove("hidden");
    logoutModal.classList.add("flex");
    logoutModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.getElementById("logoutCancelBtn").focus();
  };
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", openLogoutModal);
  document
    .getElementById("logoutCancelBtn")
    .addEventListener("click", closeLogoutModal);
  document.getElementById("logoutConfirmBtn").addEventListener("click", () => {
    localStorage.removeItem("gs_token");
    localStorage.removeItem("gs_user");
    localStorage.removeItem("gs_clientId");
    document.cookie = "gs_token=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "gs_user=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/main.html";
  });
  logoutModal.addEventListener("click", (event) => {
    if (event.target === logoutModal) closeLogoutModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !logoutModal.classList.contains("hidden"))
      closeLogoutModal();
  });

  // Update on page load and when cart updates
  updateUserMenu();
  window.addEventListener("cartUpdated", updateUserMenu);
});

// --- Block 3 ---
document.querySelectorAll("[data-reviewer-name]").forEach((reviewer) => {
  const letters = reviewer.dataset.reviewerName.replace(/[^a-z]/gi, "");
  reviewer.querySelector(".reviewer-initials").textContent = letters
    .slice(0, 2)
    .toUpperCase();
});

// --- Block 4 ---
document.addEventListener("DOMContentLoaded", function () {
  // Sticky header
  const header = document.querySelector("header");
  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) header.classList.add("shadow-md");
    else header.classList.remove("shadow-md");
  });

  const tokenKey = "gs_token";
  const userKey = "gs_user";
  const anonClientKey = "gs_clientId";

  function getToken() {
    return localStorage.getItem(tokenKey);
  }
  function getUser() {
    const u = localStorage.getItem(userKey);
    return u ? JSON.parse(u) : null;
  }
  function getClientId() {
    let id = localStorage.getItem(anonClientKey);
    if (!id) {
      id = "c_" + Date.now() + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(anonClientKey, id);
    }
    return id;
  }
  function authHeaders() {
    const t = getToken();
    return t ? { Authorization: "Bearer " + t } : {};
  }

  // Update header auth links
  const authLinks = document.getElementById("authLinks");
  const profileLink = document.getElementById("profileLink");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const user = getUser();
  if (user && getToken()) {
    if (authLinks) authLinks.classList.add("hidden");
    if (profileLink) {
      profileLink.classList.remove("hidden");
      profileLink.textContent = user.name;
    }
  } else {
    if (authLinks) authLinks.classList.remove("hidden");
    if (profileLink) profileLink.classList.add("hidden");
  }

  async function updateCartCount() {
    try {
      let url = "/api/cart";
      if (!getToken()) url += "?clientId=" + getClientId();
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const badge = document.getElementById("cartBtn").querySelector("span");
      const count = data.items
        ? data.items.reduce((s, i) => s + (i.quantity || 1), 0)
        : 0;
      if (badge) badge.textContent = count;
    } catch (e) {
      console.error(e);
    }
  }

  // Listen for cart updates
  window.addEventListener("cartUpdated", updateCartCount);

  // Attach add-to-cart handlers
  document.querySelectorAll(".smoothie-card").forEach((card) => {
    const btn = card.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const nameEl = card.querySelector("h3");
      const priceEl = card.querySelector("span.text-primary");
      const name = nameEl ? nameEl.textContent.trim() : "Product";
      let price = 0;
      if (priceEl) {
        const text = priceEl.textContent.replace(/[^0-9.]/g, "");
        price = parseFloat(text) || 0;
      }
      try {
        const body = { name, price, quantity: 1 };
        if (!getToken()) body.clientId = getClientId();
        const headers = Object.assign(
          { "Content-Type": "application/json" },
          authHeaders(),
        );
        const res = await fetch("/api/cart", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          updateCartCount();
          btn.textContent = "Added";
          setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
        } else {
          const err = await res.json();
          showToast(err.error || "Failed to add to cart", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Network error", "error");
      }
    });
  });

  // Header cart button -> cart page
  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn)
    cartBtn.addEventListener(
      "click",
      () => (window.location.href = "/cart.html"),
    );

  // Header order now -> cart
  document.querySelectorAll("button").forEach((b) => {
    if (b.textContent && b.textContent.trim().toLowerCase() === "order now") {
      b.addEventListener("click", () => (window.location.href = "/cart.html"));
    }
  });

  // Three-column delivery option tiles
  function syncHomeDeliveryOptions() {
    document.querySelectorAll(".home-delivery-option").forEach((tile) => {
      const selected = !!tile.querySelector('input[type="radio"]:checked');
      tile.classList.toggle("border-primary", selected);
      tile.classList.toggle("bg-primary/5", selected);
      tile.classList.toggle("ring-1", selected);
      tile.classList.toggle("ring-primary/20", selected);
      tile.classList.toggle("border-gray-200", !selected);
    });
  }
  document
    .querySelectorAll('input[name="delivery-option"]')
    .forEach((input) => {
      input.addEventListener("change", syncHomeDeliveryOptions);
    });
  syncHomeDeliveryOptions();

  // Saved delivery addresses for signed-in customers
  const homeSavedAddressToggle = document.getElementById(
    "homeSavedAddressToggle",
  );
  if (homeSavedAddressToggle) {
    homeSavedAddressToggle.addEventListener("click", () => {
      const content = document.getElementById("homeSavedAddressContent");
      const chevron = document.getElementById("homeSavedAddressChevron");
      const expanded =
        homeSavedAddressToggle.getAttribute("aria-expanded") === "true";
      homeSavedAddressToggle.setAttribute("aria-expanded", String(!expanded));
      if (content) content.classList.toggle("hidden", expanded);
      if (chevron)
        chevron.className = `bi ${expanded ? "bi-chevron-down" : "bi-chevron-up"} text-gray-500`;
    });
  }

  async function loadHomeSavedAddresses() {
    const section = document.getElementById("homeSavedAddressSection");
    const container = document.getElementById("homeSavedAddressCards");
    const status = document.getElementById("homeSavedAddressStatus");
    if (!section || !container || !getToken()) return;
    try {
      const res = await fetch("/api/users/me", {
        headers: authHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const userData = await res.json();
      const addresses = Array.isArray(userData.addresses)
        ? userData.addresses
        : [];
      if (!addresses.length) return;
      section.classList.remove("hidden");
      container.innerHTML = "";
      let selectedId = "";

      const selectAddress = (address, card) => {
        selectedId = String(address._id || "");
        document.querySelectorAll("[data-home-address]").forEach((item) => {
          const selected = item === card;
          item.classList.toggle("border-primary", selected);
          item.classList.toggle("bg-primary/5", selected);
          item.classList.toggle("ring-1", selected);
          item.classList.toggle("ring-primary/20", selected);
          item.classList.toggle("border-gray-200", !selected);
        });
        document.getElementById("deliveryStreet").value = address.street || "";
        document.getElementById("deliveryCity").value = address.city || "";
        document.getElementById("deliveryZip").value = address.zip || "";
        status.textContent = address.isDefault
          ? "Default selected"
          : "Address selected";
      };

      addresses.forEach((address) => {
        const card = document.createElement("button");
        card.type = "button";
        card.dataset.homeAddress = String(address._id || "");
        card.className =
          "h-full text-left rounded-xl border border-gray-200 p-4 hover:border-primary transition";
        const header = document.createElement("div");
        header.className = "flex items-start justify-between gap-2 mb-2";
        const label = document.createElement("span");
        label.className = "font-semibold text-gray-900";
        label.textContent = address.label || "Address";
        header.appendChild(label);
        if (address.isDefault) {
          const badge = document.createElement("span");
          badge.className =
            "text-[11px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700";
          badge.textContent = "Default";
          header.appendChild(badge);
        }
        const street = document.createElement("p");
        street.className = "text-sm text-gray-700";
        street.textContent = address.street || "";
        const city = document.createElement("p");
        city.className = "text-sm text-gray-500 mt-1";
        city.textContent = [address.city, address.zip]
          .filter(Boolean)
          .join(" ");
        card.append(header, street, city);
        card.addEventListener("click", () => selectAddress(address, card));
        container.appendChild(card);
      });

      const defaultAddress = addresses.find((address) => address.isDefault);
      if (defaultAddress) {
        const defaultCard = Array.from(container.children).find(
          (card) =>
            card.dataset.homeAddress === String(defaultAddress._id || ""),
        );
        if (defaultCard) selectAddress(defaultAddress, defaultCard);
      }
    } catch (err) {
      console.error("Saved address load failed:", err);
    }
  }

  function parseFullDeliveryLocation(data) {
    const address = data.address || {};
    const detailedAddress = [
      address.house_number,
      address.road ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        address.residential,
      address.neighbourhood || address.quarter,
      address.suburb,
      address.city_district,
      address.city || address.town || address.village || address.municipality,
      address.county || address.state_district,
      address.state,
      address.postcode,
      address.country,
    ]
      .filter((part, index, values) => part && values.indexOf(part) === index)
      .join(", ");
    return {
      fullAddress: data.display_name || detailedAddress,
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "",
      postcode: address.postcode || "",
    };
  }

  // Geolocation for delivery address
  const useLocationBtn = document.getElementById("useLocationBtn");
  const homeGeoStatus = document.getElementById("homeGeoStatus");
  if (useLocationBtn) {
    useLocationBtn.addEventListener("click", function () {
      if (!navigator.geolocation) {
        if (homeGeoStatus)
          homeGeoStatus.textContent =
            "Geolocation is not supported by this browser.";
        return;
      }
      useLocationBtn.disabled = true;
      useLocationBtn.innerHTML =
        '<i class="bi bi-geo-alt"></i> Getting location...';
      if (homeGeoStatus)
        homeGeoStatus.textContent = "Requesting a high-accuracy location...";
      navigator.geolocation.getCurrentPosition(
        async function (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            if (homeGeoStatus)
              homeGeoStatus.textContent = "Fetching the complete address...";
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
            );
            if (!res.ok) throw new Error("Reverse geocoding failed");
            const data = await res.json();
            const location = parseFullDeliveryLocation(data);
            if (!location.fullAddress)
              throw new Error("No address found for this location");
            document.getElementById("deliveryStreet").value =
              location.fullAddress;
            document.getElementById("deliveryCity").value = location.city;
            document.getElementById("deliveryZip").value = location.postcode;
            const accuracy = Math.round(position.coords.accuracy || 0);
            if (homeGeoStatus)
              homeGeoStatus.textContent = `Complete address filled${accuracy ? ` (GPS accuracy about ${accuracy} m)` : ""}.`;
            useLocationBtn.innerHTML =
              '<i class="bi bi-check-circle"></i> Location Filled';
          } catch (e) {
            if (homeGeoStatus)
              homeGeoStatus.textContent =
                "Could not fetch the complete address. Please enter it manually.";
          } finally {
            useLocationBtn.disabled = false;
            setTimeout(() => {
              useLocationBtn.innerHTML =
                '<i class="bi bi-geo-alt"></i> Use My Location';
            }, 1800);
          }
        },
        function (error) {
          if (homeGeoStatus)
            homeGeoStatus.textContent = `Could not access location: ${error.message}`;
          useLocationBtn.disabled = false;
          useLocationBtn.innerHTML =
            '<i class="bi bi-geo-alt"></i> Use My Location';
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  loadHomeSavedAddresses();
  updateCartCount();
});

// --- Block 5 ---
(function () {
  function toggleHomeLink() {
    const isHome =
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("main.html") ||
      window.location.pathname.endsWith("index.html");
    document.querySelectorAll("header nav a").forEach((a) => {
      if (a.textContent && a.textContent.trim().toLowerCase() === "home") {
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
