// --- Block 1 ---
const tokenKey = "gs_admin_token";
const userKey = "gs_admin_user";
const state = { dashboard: null, products: [] };
const apiBaseUrl =
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  window.location.port !== "3000"
    ? `http://${window.location.hostname}:3000`
    : "";
const apiUrl = (path) => `${apiBaseUrl}${path}`;

function token() {
  return localStorage.getItem(tokenKey) || "";
}
function authHeaders(extra = {}) {
  return { ...extra, Authorization: "Bearer " + token() };
}
async function readApiJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}). Please refresh and confirm the app is running on port 3000.`,
    );
  }
}
function money(value) {
  return "Rs " + Number(value || 0).toLocaleString("en-IN");
}
function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
function dateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dd = String(date.getDate()).padStart(2, "0");
  const mmm = months[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
}
function fileTypeLabel(contentType) {
  const map = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/heic": "HEIC",
    "image/heif": "HEIF",
    "image/avif": "AVIF",
    "image/svg+xml": "SVG",
    "image/tiff": "TIFF",
    "image/bmp": "BMP",
    "video/mp4": "MP4",
    "video/quicktime": "MOV",
    "video/webm": "WebM",
  };
  return map[contentType] || (contentType || "").split("/").pop().toUpperCase();
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function statusClass(status, type = "order") {
  const value = String(status || "").toLowerCase();
  if (["paid", "confirmed", "delivered", "completed"].includes(value))
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (["pending", "unpaid", "cash due", "preparing"].includes(value))
    return type === "payment"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
      : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (["cancelled", "failed", "refunded"].includes(value))
    return "bg-red-50 text-red-700 ring-1 ring-red-100";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}
function metaFromForm(formData) {
  const meta = {};
  ["calories", "protein", "carbs", "fat", "fiber", "sugar"].forEach((key) => {
    const value = formData.get(key);
    if (value !== null && value !== "") meta[key] = Number(value);
  });
  const ingredients = String(formData.get("ingredients") || "").trim();
  if (ingredients)
    meta.ingredients = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  return meta;
}

function renderStats(totals) {
  const cards = [
    ["Sales", money(totals.totalSales), "graph-up", "All order value"],
    ["Earnings", money(totals.totalEarnings), "wallet2", "Paid ledger value"],
    ["Orders", totals.orders || 0, "bag", "Total orders"],
    ["Customers", totals.users || 0, "person", "User records"],
    [
      "Payments",
      totals.payments || 0,
      "credit-card",
      `${totals.pendingPayments || 0} pending`,
    ],
    ["Paid", totals.paidPayments || 0, "check-circle", "Cleared payments"],
    [
      "Live Menu",
      totals.activeProducts || 0,
      "fork-knife",
      "Available products",
    ],
    ["Archived", totals.archivedProducts || 0, "archive", "Hidden products"],
  ];

  document.getElementById("statsGrid").innerHTML = cards
    .map(
      ([label, value, icon, hint]) => `
        <article class="metric p-4 min-h-[128px]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-muted">${label}</p>
              <p class="mt-2 text-2xl font-black text-ink">${value}</p>
            </div>
            <div class="w-10 h-10 rounded-xl bg-teal-50 text-primary flex items-center justify-center"><i class="bi bi-${icon} text-xl"></i></div>
          </div>
          <p class="mt-4 text-xs uppercase tracking-[0.14em] font-black text-slate-400">${hint}</p>
        </article>
      `,
    )
    .join("");
}

function renderDb(database) {
  const connected = database.status === "connected";
  const stateText = connected ? "Connected" : "Disconnected";
  const host =
    [database.host, database.port].filter(Boolean).join(":") || "localhost";
  const counts = database.collectionCounts || {};
  const serverTime = database.serverTime
    ? new Date(database.serverTime)
    : new Date();
  document.getElementById("dbStatusLabel").className = connected
    ? "db-badge bg-emerald-50 text-emerald-700"
    : "db-badge bg-red-50 text-red-700";
  document.getElementById("dbStatusLabel").innerHTML =
    `<i class="bi bi-database"></i> ${connected ? "CONNECTED" : "DISCONNECTED"}`;
  document.getElementById("dbServerTime").textContent =
    `Server time: ${serverTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")} ${serverTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}`;

  const infoCards = [
    ["Host", host, "plug", "bg-sky-50 text-sky-600", "Cluster endpoint"],
    [
      "Database",
      database.name || "gosmoothie",
      "database",
      "bg-indigo-50 text-indigo-600",
      "Active schema",
    ],
    [
      "State Code",
      database.stateCode ?? "-",
      "broadcast-pin",
      "bg-emerald-50 text-emerald-600",
      "Mongoose readyState",
    ],
    [
      "State",
      stateText,
      "info-circle",
      connected ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600",
      "Current connection",
    ],
  ];

  const chips = [
    ["Users", counts.users ?? 0, "people", "text-blue-600", "users"],
    ["Admins", counts.admins ?? 0, "shield-check", "text-red-600", "admins"],
    ["Products", counts.products ?? 0, "fork-knife", "text-orange-600", null],
    [
      "Orders",
      counts.orders ?? 0,
      "file-earmark-text",
      "text-violet-600",
      null,
    ],
    ["Payments", counts.payments ?? 0, "wallet2", "text-emerald-600", null],
    ["Carts", counts.carts ?? 0, "cart", "text-cyan-600", null],
    ["Addresses", counts.addresses ?? 0, "geo-alt", "text-rose-600", null],
    ["Indexes", database.indexes ?? 0, "history", "text-slate-600", null],
  ];

  document.getElementById("dbStatusBar").innerHTML = `
        <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          ${infoCards
            .map(
              ([label, value, icon, tone, hint]) => `
            <div class="db-info-card">
              <span class="db-icon ${tone}"><i class="bi bi-${icon} text-xl"></i></span>
              <div class="min-w-0">
                <p class="text-sm text-muted">${label}</p>
                <p class="font-black text-ink truncate">${escapeHtml(value)}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">${hint}</p>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          ${chips
            .map(
              ([label, value, icon, tone, action]) => `
            <div class="db-chip${action ? " cursor-pointer hover:ring-2 hover:ring-primary/30 transition" : ""}" ${action ? `data-db-modal="${action}"` : ""}>
              <span class="min-w-0 flex items-center gap-2 text-sm text-slate-700">
                <i class="bi bi-${icon} ${tone} text-lg"></i>
                <span class="truncate">${label}</span>
              </span>
              <span class="font-black text-ink">${escapeHtml(value)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
          ${[
            [
              "Collections",
              database.collections ?? 0,
              "layers",
              "border-emerald-100 bg-emerald-50/70",
              "bg-emerald-100 text-emerald-700",
              "collections",
            ],
            [
              "Documents",
              database.objects ?? 0,
              "file-earmark-text",
              "border-blue-100 bg-blue-50/70",
              "bg-blue-100 text-blue-700",
              "documents",
            ],
            [
              "Storage",
              formatBytes(database.storageSize),
              "device-hdd",
              "border-orange-100 bg-orange-50/70",
              "bg-orange-100 text-orange-700",
              "storage",
            ],
          ]
            .map(
              ([label, value, icon, cardTone, iconTone, action]) => `
            <div class="rounded-xl border ${cardTone} px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:ring-2 hover:ring-primary/30 transition" data-db-modal="${action}">
              <span class="min-w-0 flex items-center gap-2 text-slate-700 font-semibold">
                <span class="w-8 h-8 rounded-lg ${iconTone} flex items-center justify-center shrink-0"><i class="bi bi-${icon} text-lg"></i></span>
                <span class="truncate">${label}</span>
              </span>
              <span class="font-black text-ink">${escapeHtml(value)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      `;
}

function renderPulse(data) {
  const totals = data.totals || {};
  const orders = data.orders || data.recentOrders || [];
  const activeOrders = orders.filter((order) =>
    ["pending", "confirmed", "preparing"].includes(
      String(order.orderStatus || "").toLowerCase(),
    ),
  ).length;
  const unpaid = totals.pendingPayments || 0;
  const cards = [
    [
      "Active queue",
      activeOrders,
      "Orders not closed",
      "stopwatch",
      activeOrders
        ? "bg-blue-50 text-blue-700"
        : "bg-emerald-50 text-emerald-700",
    ],
    [
      "Payment review",
      unpaid,
      "Need attention",
      "exclamation-triangle",
      unpaid ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
    ],
    [
      "Menu live",
      totals.activeProducts || 0,
      "Customer visible",
      "leaf",
      "bg-teal-50 text-teal-700",
    ],
  ];
  document.getElementById("opsPulse").innerHTML = cards
    .map(
      ([label, value, hint, icon, tone]) => `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-black text-ink">${label}</p>
            <p class="mt-1 text-xs text-muted">${hint}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-2xl font-black text-ink">${value}</span>
            <span class="w-10 h-10 rounded-xl ${tone} flex items-center justify-center"><i class="bi bi-${icon} text-xl"></i></span>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderTopProducts(products) {
  const rows = (products || []).slice(0, 6);
  document.getElementById("topProducts").innerHTML =
    rows
      .map(
        (item, index) => `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-primary">${index + 1}</div>
          <div class="min-w-0 flex-1">
            <p class="font-black text-ink truncate">${escapeHtml(item.productName || "Unknown item")}</p>
            <p class="text-xs text-muted mt-0.5">${Number(item.quantity || 0)} units sold</p>
          </div>
          <p class="font-black text-ink">${money(item.revenue)}</p>
        </div>
      `,
      )
      .join("") ||
    '<div class="md:col-span-2 rounded-xl border border-dashed border-slate-300 p-5 text-center text-muted">No sales data yet</div>';
}

function renderOrders(orders) {
  document.getElementById("ordersTable").innerHTML =
    orders
      .map((order) => {
        const items =
          (order.items || [])
            .map(
              (item) =>
                `${item.quantity || 1}x ${escapeHtml(item.productName || item.name || "Item")}`,
            )
            .join("<br>") || "&mdash;";
        const method = String(order.paymentMethod || "").trim();
        const methodLine = method
          ? `<span class="text-xs text-muted">${escapeHtml(method)}</span>`
          : "";
        return `
          <tr class="table-row align-top">
            <td class="py-4 pr-4"><p class="font-black text-ink">${escapeHtml(order.customerName || "Unknown")}</p><p class="text-xs text-muted mt-1">${escapeHtml(order.customerEmail || "")}</p></td>
            <td class="py-4 pr-4"><p class="font-mono font-black text-ink">${escapeHtml(order.orderId || "-")}</p><p class="text-xs text-muted mt-1">${dateTime(order.createdAt)}</p></td>
            <td class="py-4 pr-4 text-slate-700 leading-6">${items}</td>
            <td class="py-4 pr-4 font-black text-ink">${money(order.totalAmount)}</td>
            <td class="py-4 pr-4"><div class="flex flex-col gap-1"><span class="status-pill ${statusClass(order.orderStatus, "order")}">${escapeHtml(order.orderStatus || "pending")}</span><span class="status-pill ${statusClass(order.paymentStatus, "payment")}">${escapeHtml(order.paymentStatus || "unpaid")}</span>${methodLine}</div></td>
          </tr>
        `;
      })
      .join("") ||
    '<tr><td colspan="5" class="py-10 text-center text-muted">No orders yet</td></tr>';
}

function renderPayments(payments) {
  document.getElementById("paymentsTable").innerHTML =
    payments
      .map(
        (payment) => `
        <tr class="table-row align-top">
          <td class="py-4 pr-4"><p class="font-black text-ink">${escapeHtml(payment.customerName || "Unknown")}</p><p class="text-xs text-muted mt-1">${escapeHtml(payment.customerEmail || "")}</p></td>
          <td class="py-4 pr-4"><p class="font-mono font-black text-ink">${escapeHtml(payment.paymentId || "-")}</p><p class="text-xs text-muted mt-1">${dateTime(payment.createdAt)}</p></td>
          <td class="py-4 pr-4 font-black text-ink">${money(payment.amountPaid)}</td>
          <td class="py-4 pr-4 text-slate-700">${escapeHtml(payment.paymentMethod || "Manual")}</td>
          <td class="py-4 pr-4"><span class="status-pill ${statusClass(payment.paymentStatus, "payment")}">${escapeHtml(payment.paymentStatus || "pending")}</span></td>
        </tr>
      `,
      )
      .join("") ||
    '<tr><td colspan="5" class="py-10 text-center text-muted"><div class="space-y-2"><i class="bi bi-credit-card text-3xl text-slate-300"></i><p>No payments recorded yet</p><p class="text-xs">Payments will appear here once customers complete orders.</p></div></td></tr>';
}

function nutrition(product) {
  const meta = product.meta || {};
  return [
    ["Cal", meta.calories],
    ["Pro", meta.protein],
    ["Carb", meta.carbs],
    ["Sugar", meta.sugar],
  ].filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
}

function renderProducts(products) {
  state.products = products;
  document.getElementById("productsTable").innerHTML =
    products
      .map((product) => {
        const ingredients =
          product.meta && Array.isArray(product.meta.ingredients)
            ? product.meta.ingredients.slice(0, 3)
            : [];
        return `
          <tr class="table-row align-top">
            <td class="py-4 pr-4 w-[140px]">
              <img src="${product.image || "/assets/images/smoothie-bowl.jpg"}" alt="${escapeHtml(product.name)}" class="w-28 h-20 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-sm" onerror="if(this.dataset.fallback){this.style.display='none';var s=document.createElement('span');s.className='text-xs text-muted p-2 block';s.textContent=this.alt;this.parentNode.insertBefore(s,this.nextSibling)}else{this.dataset.fallback='1';this.src='/assets/images/smoothie-bowl.jpg'}">
              <p class="mt-2 text-[11px] font-mono text-muted">${escapeHtml(product.productCode || product.productId || "")}</p>
            </td>
            <td class="py-4 pr-4 w-[220px]">
              <p class="font-black text-ink">${escapeHtml(product.name)}</p>
              <p class="text-xs text-muted mt-1 line-clamp-2">${escapeHtml(product.description || "")}</p>
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mt-2">${escapeHtml(product.category || "Menu")} · ${escapeHtml(product.type || "Vegetarian")}</p>
              <div class="mt-2 flex flex-wrap gap-1">${ingredients.map((item) => `<span class="px-2 py-1 rounded-full bg-teal-50 text-primary text-[11px] font-black">${escapeHtml(item)}</span>`).join("")}</div>
            </td>
            <td class="py-4 pr-4">
              <div class="grid grid-cols-2 gap-1.5">${
                nutrition(product)
                  .map(
                    ([label, value]) =>
                      `<span class="rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 text-xs"><b>${label}</b> ${escapeHtml(value)}</span>`,
                  )
                  .join("") || '<span class="text-xs text-muted">No data</span>'
              }</div>
            </td>
            <td class="py-4 pr-4 font-black text-ink">${money(product.price)}</td>
            <td class="py-4 pr-4"><span class="status-pill ${product.isArchived ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100" : product.isOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}">${product.isArchived ? "Archived" : product.isOutOfStock ? "Out of Stock" : "In Stock"}</span></td>
            <td class="py-4 pr-4 text-center">
              ${product.isFeatured ? '<i class="bi bi-patch-check-fill text-green-500 text-2xl"></i>' : '<span class="text-slate-300 text-2xl">—</span>'}
            </td>
            <td class="py-4 pr-4">
              <div class="flex gap-2">
                <button data-action="edit" data-id="${product.productId}" class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition active:scale-95"><i class="bi bi-pencil-square text-lg"></i></button>
                <button data-action="stock" data-id="${product.productId}" class="w-9 h-9 rounded-lg ${product.isOutOfStock ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"} flex items-center justify-center transition active:scale-95"><i class="bi ${product.isOutOfStock ? "bi-box-seam" : "bi-x-octagon"} text-lg"></i></button>
                <button data-action="toggle" data-id="${product.productId}" class="w-9 h-9 rounded-lg ${product.isArchived ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"} flex items-center justify-center transition active:scale-95"><i class="bi ${product.isArchived ? "bi-arrow-counterclockwise" : "bi-archive"} text-lg"></i></button>
                <button data-action="delete" data-id="${product.productId}" class="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition active:scale-95"><i class="bi bi-trash3 text-lg"></i></button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("") ||
    '<tr><td colspan="7" class="py-10 text-center text-muted">No products found</td></tr>';
}

// Sync category dropdown options from loaded products
function syncCategoryDropdown() {
  const catSelect = document.getElementById("categorySelect");
  if (!catSelect || !state.products) return;
  const existing = new Set();
  state.products.forEach((p) => {
    if (p.category && p.category.trim()) existing.add(p.category.trim());
  });
  // Remove all dynamic options (keep first empty + last __custom__)
  const staticValues = new Set([
    "",
    "__custom__",
    "Smoothies",
    "Seasonal Fruit Juices / Smoothies",
    "Salads",
    "Protein Bowls",
    "Healthy Snacks",
    "Ice Creams & Gelato",
    "Cold-Pressed Juices",
  ]);
  // Add any categories from products not already in static list
  existing.forEach((cat) => {
    if (!staticValues.has(cat)) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      // Insert before the last "__custom__" option
      const customOpt = catSelect.querySelector('option[value="__custom__"]');
      catSelect.insertBefore(opt, customOpt);
    }
  });
}

// Catalog search filter
document.getElementById("catalogSearch").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  const clearBtn = document.getElementById("catalogSearchClear");
  clearBtn.classList.toggle("hidden", !this.value);
  const rows = document.querySelectorAll("#productsTable tr");
  rows.forEach((row) => {
    if (!query) {
      row.style.display = "";
      return;
    }
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
});

document
  .getElementById("catalogSearchClear")
  .addEventListener("click", function () {
    const input = document.getElementById("catalogSearch");
    input.value = "";
    input.dispatchEvent(new Event("input"));
    this.classList.add("hidden");
  });

function updatePreview(src) {
  const preview = document.getElementById("imagePreview");
  if (preview) preview.src = src || "/assets/images/smoothie-bowl.jpg";
}

const workspaceCopy = {
  overview: [
    "Overview",
    "Monitor revenue, fulfillment, product quality, and database health.",
  ],
  orders: [
    "Orders",
    "Review customer orders, item mixes, value, and fulfillment status.",
  ],
  payments: [
    "Payments",
    "Audit payment records, methods, status, and cleared revenue.",
  ],
  catalog: [
    "Catalog",
    "Manage product availability, image quality, nutrition tags, and archive state.",
  ],
  editor: [
    "Product Editor",
    "Create new products or refine an existing menu item.",
  ],
  gallery: ["Image Gallery", "Manage product images stored in the database."],
};

function showView(viewId, shouldScroll = true) {
  const nextView = workspaceCopy[viewId] ? viewId : "overview";
  document.querySelectorAll(".admin-view").forEach((view) => {
    view.hidden = view.id !== nextView;
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.viewTarget === nextView);
  });
  const [title, subtitle] = workspaceCopy[nextView];
  document.getElementById("workspaceTitle").textContent = title;
  document.getElementById("workspaceSubtitle").textContent = subtitle;
  if (location.hash !== `#${nextView}`)
    history.replaceState(null, "", `#${nextView}`);
  if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateForm(product) {
  showView("editor");
  hideFormError();
  hideFallbackNotice();
  document.getElementById("imageFilePreview").classList.add("hidden");
  const form = document.getElementById("productForm");
  form.productId.value = product.productId || "";
  form.name.value = product.name || "";
  form.price.value = product.price ?? "";

  // Category: set dropdown or show custom input
  const catSelect = document.getElementById("categorySelect");
  const catVal = product.category || "";
  const customWrap = document.getElementById("customCategoryWrap");
  const catInput = document.getElementById("customCategoryInput");
  const catHidden = document.getElementById("categoryHidden");
  const matchOption = Array.from(catSelect.options).find(
    (opt) =>
      opt.value === catVal && opt.value !== "__custom__" && opt.value !== "",
  );
  if (matchOption) {
    catSelect.value = catVal;
    customWrap.classList.add("hidden");
    if (catInput) catInput.value = "";
    if (catHidden) catHidden.value = catVal;
  } else if (catVal) {
    catSelect.value = "__custom__";
    customWrap.classList.remove("hidden");
    if (catInput) catInput.value = catVal;
    if (catHidden) catHidden.value = catVal;
  } else {
    catSelect.value = "";
    customWrap.classList.add("hidden");
    if (catInput) catInput.value = "";
    if (catHidden) catHidden.value = "";
  }

  form.type.value = product.type || "Vegetarian";
  form.description.value = product.description || "";
  form.image.value = product.image || "";
  form.isFeatured.checked = !!product.isFeatured;
  form.featuredOrder.value =
    product.featuredOrder && product.featuredOrder < 999
      ? product.featuredOrder
      : "";
  const meta = product.meta || {};
  form.calories.value = meta.calories ?? "";
  form.protein.value = meta.protein ?? "";
  form.carbs.value = meta.carbs ?? "";
  form.fat.value = meta.fat ?? "";
  form.fiber.value = meta.fiber ?? "";
  form.sugar.value = meta.sugar ?? "";
  form.ingredients.value = Array.isArray(meta.ingredients)
    ? meta.ingredients.join(", ")
    : "";
  updatePreview(product.image || "");
  // Show archive button for existing products
  const archiveBtn = document.getElementById("archiveBtn");
  if (archiveBtn) {
    archiveBtn.classList.remove("hidden");
    if (product.isArchived) {
      archiveBtn.innerHTML =
        '<i class="bi bi-arrow-counterclockwise"></i> Restore';
      archiveBtn.className =
        "btn bg-green-50 text-green-600 border border-green-100 hover:bg-green-100";
    } else {
      archiveBtn.innerHTML = '<i class="bi bi-archive"></i> Archive';
      archiveBtn.className =
        "btn bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100";
    }
  }
  const deleteBtn = document.getElementById("deleteProductBtn");
  if (deleteBtn) deleteBtn.classList.remove("hidden");
  const archiveCheckbox = document.getElementById("archiveCheckboxLabel");
  if (archiveCheckbox) archiveCheckbox.classList.add("hidden");
}

function clearForm() {
  const form = document.getElementById("productForm");
  form.reset();
  form.productId.value = "";
  form.type.value = "Vegetarian";
  // Reset category dropdown
  const catSelect = document.getElementById("categorySelect");
  if (catSelect) catSelect.value = "";
  const customWrap = document.getElementById("customCategoryWrap");
  if (customWrap) customWrap.classList.add("hidden");
  const catInput = document.getElementById("customCategoryInput");
  if (catInput) catInput.value = "";
  const catHidden = document.getElementById("categoryHidden");
  if (catHidden) catHidden.value = "";
  updatePreview("/assets/images/smoothie-bowl.jpg");
  document.getElementById("imageFilePreview").classList.add("hidden");
  hideFormError();
  hideFallbackNotice();
  // Hide archive button for new products
  const archiveBtn = document.getElementById("archiveBtn");
  if (archiveBtn) archiveBtn.classList.add("hidden");
  const deleteBtn = document.getElementById("deleteProductBtn");
  if (deleteBtn) deleteBtn.classList.add("hidden");
  const archiveCheckbox = document.getElementById("archiveCheckboxLabel");
  if (archiveCheckbox) archiveCheckbox.classList.remove("hidden");
}

async function loadDashboard() {
  if (!token()) {
    window.location.href = "/admin-login.html";
    return;
  }
  const response = await fetch(apiUrl("/api/admins/dashboard"), {
    headers: authHeaders(),
  });
  const data = await readApiJson(response);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      window.location.href = "/admin-login.html";
      return;
    }
    throw new Error(data.error || "Unable to load dashboard");
  }
  state.dashboard = data;
  renderStats(data.totals || {});
  renderDb(data.database || {});
  renderPulse(data);
  renderTopProducts(data.topProducts || []);
  renderOrders(data.orders || data.recentOrders || []);
  renderPayments(data.payments || data.recentPayments || []);
  renderProducts([
    ...(data.products?.active || []),
    ...(data.products?.archived || []),
  ]);
}

async function loadProducts() {
  const response = await fetch(apiUrl("/api/products?includeArchived=true"), {
    headers: authHeaders(),
  });
  const data = await readApiJson(response);
  if (!response.ok) throw new Error(data.error || "Unable to load products");
  renderProducts(data);
  syncCategoryDropdown();
}

async function refreshAll() {
  await loadDashboard();
  await loadProducts();
  try {
    await loadGallery();
  } catch (e) {}
}

document.getElementById("refreshBtn").addEventListener("click", async () => {
  try {
    await refreshAll();
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  window.location.href = "/admin-login.html";
});

const sidebarToggle = document.getElementById("sidebarToggle");
let sidebarToggleIcon = document.getElementById("sidebarToggleIcon");
function syncSidebarToggle() {
  const collapsed = document.body.classList.contains("sidebar-collapsed");
  sidebarToggle.setAttribute(
    "aria-label",
    collapsed ? "Open sidebar" : "Close sidebar",
  );
  sidebarToggle.title = collapsed ? "Open sidebar" : "Close sidebar";
  const iconName = collapsed ? "layout-sidebar" : "layout-sidebar-inset";
  sidebarToggleIcon.outerHTML = `<i id="sidebarToggleIcon" class="bi bi-${iconName} text-xl"></i>`;
  sidebarToggleIcon = document.getElementById("sidebarToggleIcon");
}
if (localStorage.getItem("gs_admin_sidebar") === "collapsed") {
  document.body.classList.add("sidebar-collapsed");
}
syncSidebarToggle();
sidebarToggle.addEventListener("click", () => {
  document.body.classList.toggle("sidebar-collapsed");
  localStorage.setItem(
    "gs_admin_sidebar",
    document.body.classList.contains("sidebar-collapsed")
      ? "collapsed"
      : "expanded",
  );
  syncSidebarToggle();
});

document.getElementById("resetFormBtn").addEventListener("click", clearForm);

document
  .getElementById("cancelEditBtn")
  .addEventListener("click", async function () {
    const confirmed = await showDiscardModal();
    if (confirmed) {
      clearForm();
      showView("catalog");
    }
  });

document.getElementById("archiveBtn").addEventListener("click", async () => {
  hideFormError();
  hideFallbackNotice();
  const form = document.getElementById("productForm");
  const productId = form.productId.value;
  if (!productId) {
    showFormError("Select a product from the catalog first.");
    return;
  }
  const product = state.products.find((item) => item.productId === productId);
  const url =
    product && product.isArchived
      ? `/api/products/${productId}/restore`
      : `/api/products/${productId}`;
  const method = product && product.isArchived ? "PUT" : "DELETE";
  const response = await fetch(apiUrl(url), {
    method,
    headers: authHeaders(),
  });
  const data = await readApiJson(response);
  if (!response.ok) {
    showFormError(data.error || "Unable to update product");
    return;
  }
  await loadProducts();
  // Re-populate form with updated product data (don't close)
  const updatedProduct = state.products.find(
    (item) => item.productId === productId,
  );
  if (updatedProduct) {
    populateForm(updatedProduct);
  }
});

document
  .getElementById("deleteProductBtn")
  .addEventListener("click", async () => {
    const form = document.getElementById("productForm");
    const productId = form.productId.value;
    if (!productId) return;
    const confirmed = await showDeleteModal();
    if (!confirmed) return;
    const response = await fetch(
      apiUrl(`/api/products/${productId}/permanent`),
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
    const data = await readApiJson(response);
    if (!response.ok) {
      showFormError(data.error || "Unable to delete product");
      return;
    }
    await loadProducts();
    clearForm();
    showView("catalog");
  });

document.getElementById("productForm").addEventListener("change", (event) => {
  if (event.target.name !== "imageFile") return;
  const file = event.target.files && event.target.files[0];
  const previewEl = document.getElementById("imageFilePreview");
  if (!file) {
    previewEl.classList.add("hidden");
    return;
  }
  // Show file preview with thumbnail, name, and size
  const thumbEl = document.getElementById("imageFileThumb");
  const nameEl = document.getElementById("imageFileName");
  const sizeEl = document.getElementById("imageFileSize");
  nameEl.textContent = file.name;
  const sizeKB = file.size / 1024;
  sizeEl.textContent =
    sizeKB >= 1024
      ? `${(sizeKB / 1024).toFixed(2)} MB`
      : `${sizeKB.toFixed(1)} KB`;
  const reader = new FileReader();
  reader.onload = () => {
    thumbEl.src = reader.result;
    updatePreview(reader.result);
  };
  reader.readAsDataURL(file);
  previewEl.classList.remove("hidden");
});

document
  .getElementById("productForm")
  .image.addEventListener("input", (event) => {
    updatePreview(event.target.value.trim());
  });

function showFormError(message) {
  const el = document.getElementById("formErrorNotice");
  el.textContent = message;
  el.classList.remove("hidden");
}
function hideFormError() {
  document.getElementById("formErrorNotice").classList.add("hidden");
}
function showFallbackNotice() {
  document.getElementById("formFallbackNotice").classList.remove("hidden");
}
function hideFallbackNotice() {
  document.getElementById("formFallbackNotice").classList.add("hidden");
}

function showDiscardModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("discardModal");
    const backdrop = document.getElementById("discardModalBackdrop");
    const cancelBtn = document.getElementById("discardModalCancel");
    const confirmBtn = document.getElementById("discardModalConfirm");

    modal.classList.remove("hidden");

    function cleanup(result) {
      modal.classList.add("hidden");
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      backdrop.removeEventListener("click", onCancel);
      resolve(result);
    }

    function onCancel() {
      cleanup(false);
    }
    function onConfirm() {
      cleanup(true);
    }

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    backdrop.addEventListener("click", onCancel);
  });
}

function showDeleteModal() {
  return new Promise((resolve) => {
    const modal = document.getElementById("deleteModal");
    const backdrop = document.getElementById("deleteModalBackdrop");
    const cancelBtn = document.getElementById("deleteModalCancel");
    const confirmBtn = document.getElementById("deleteModalConfirm");

    modal.classList.remove("hidden");

    function cleanup(result) {
      modal.classList.add("hidden");
      cancelBtn.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      backdrop.removeEventListener("click", onCancel);
      resolve(result);
    }

    function onCancel() {
      cleanup(false);
    }
    function onConfirm() {
      cleanup(true);
    }

    cancelBtn.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    backdrop.addEventListener("click", onCancel);
  });
}

// Sync custom category input to hidden field
document
  .getElementById("customCategoryInput")
  .addEventListener("input", function () {
    document.getElementById("categoryHidden").value = this.value.trim();
  });

document
  .getElementById("productForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    hideFormError();
    hideFallbackNotice();
    const form = event.target;
    const formData = new FormData(form);
    const productId = String(formData.get("productId") || "").trim();
    const fileInput = form.imageFile;
    const hasFile = fileInput.files && fileInput.files.length > 0;

    let response;
    if (hasFile) {
      // Submit as multipart FormData
      const multipart = new FormData();
      multipart.append("image", fileInput.files[0]);
      multipart.append("name", String(formData.get("name") || "").trim());
      multipart.append(
        "description",
        String(formData.get("description") || "").trim(),
      );
      multipart.append(
        "category",
        String(formData.get("category") || "").trim(),
      );
      multipart.append(
        "type",
        String(formData.get("type") || "Vegetarian").trim(),
      );
      multipart.append("price", String(Number(formData.get("price") || 0)));
      multipart.append("meta", JSON.stringify(metaFromForm(formData)));
      multipart.append(
        "isFeatured",
        formData.get("isFeatured") ? "true" : "false",
      );
      multipart.append(
        "featuredOrder",
        String(Number(formData.get("featuredOrder") || 999)),
      );
      multipart.append(
        "isArchived",
        formData.get("isArchived") ? "true" : "false",
      );
      response = await fetch(
        apiUrl(productId ? `/api/products/${productId}` : "/api/products"),
        {
          method: productId ? "PUT" : "POST",
          headers: { Authorization: "Bearer " + token() },
          body: multipart,
        },
      );
    } else {
      // Submit as JSON
      const payload = {
        name: String(formData.get("name") || "").trim(),
        description: String(formData.get("description") || "").trim(),
        category: String(formData.get("category") || "").trim(),
        type: String(formData.get("type") || "Vegetarian").trim(),
        price: Number(formData.get("price") || 0),
        image: String(formData.get("image") || "").trim(),
        meta: metaFromForm(formData),
        isFeatured: !!formData.get("isFeatured"),
        featuredOrder: Number(formData.get("featuredOrder") || 999),
        isArchived: !!formData.get("isArchived"),
      };
      response = await fetch(
        apiUrl(productId ? `/api/products/${productId}` : "/api/products"),
        {
          method: productId ? "PUT" : "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        },
      );
    }

    const data = await readApiJson(response);
    if (!response.ok) {
      // Display error within 1 second, retain form values
      showFormError(data.error || "Unable to save product");
      return;
    }
    // Check for disk fallback (image path starts with /server/images/uploads/)
    if (data.image && data.image.startsWith("/server/images/uploads/")) {
      showFallbackNotice();
    }
    // Reload product list within 2 seconds on success
    await loadProducts();
    clearForm();
    showToast(
      productId
        ? "Product updated successfully"
        : "Product created successfully",
    );
  });

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const productId = button.dataset.id;
  const action = button.dataset.action;
  const product = state.products.find((item) => item.productId === productId);
  if (!product) return;

  if (action === "edit") {
    populateForm(product);
    return;
  }

  if (action === "stock") {
    fetch(apiUrl(`/api/products/${productId}/stock`), {
      method: "PUT",
      headers: authHeaders(),
    })
      .then(async (response) => ({
        response,
        data: await readApiJson(response),
      }))
      .then(async ({ response, data }) => {
        if (!response.ok) {
          showFormError(data.error || "Unable to update stock");
          return;
        }
        await loadProducts();
      });
    return;
  }

  if (action === "toggle") {
    const url = product.isArchived
      ? `/api/products/${productId}/restore`
      : `/api/products/${productId}`;
    const method = product.isArchived ? "PUT" : "DELETE";
    fetch(apiUrl(url), { method, headers: authHeaders() })
      .then(async (response) => ({
        response,
        data: await readApiJson(response),
      }))
      .then(async ({ response, data }) => {
        if (!response.ok) {
          showFormError(data.error || "Unable to update product");
          return;
        }
        await loadProducts();
      });
  }

  if (action === "delete") {
    (async () => {
      const confirmed = await showDeleteModal();
      if (!confirmed) return;
      fetch(apiUrl(`/api/products/${productId}/permanent`), {
        method: "DELETE",
        headers: authHeaders(),
      })
        .then(async (response) => ({
          response,
          data: await readApiJson(response),
        }))
        .then(async ({ response, data }) => {
          if (!response.ok) {
            showFormError(data.error || "Unable to delete product");
            return;
          }
          await loadProducts();
          clearForm();
        });
    })();
    return;
  }
});

document.querySelectorAll(".nav-item").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.viewTarget || "overview");
  });
});

window.addEventListener("hashchange", () => {
  showView((location.hash || "#overview").slice(1), false);
});

const initialView = (location.hash || "#overview").slice(1);
if (initialView === "editor") {
  showView("catalog", false);
} else {
  showView(initialView, false);
}

// --- Image Gallery ---
async function loadGallery() {
  const res = await fetch(apiUrl("/api/products/images/gallery"), {
    headers: authHeaders(),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || "Failed to load gallery");
  renderGallery(data);
}

function renderGallery(images) {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  if (!images || images.length === 0) {
    grid.innerHTML =
      '<div class="col-span-full text-center text-muted py-10">No images stored</div>';
    return;
  }

  // Group by category
  const groups = {};
  images.forEach((img) => {
    const cat = img.category || "Other";
    const key = cat.toLowerCase();
    if (!groups[key]) groups[key] = { title: cat, items: [] };
    groups[key].items.push(img);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  grid.className = "space-y-8";
  grid.innerHTML = sortedKeys
    .map((key) => {
      const section = groups[key];
      return `
            <div>
              <div class="flex items-center gap-3 mb-4">
                <h3 class="text-lg font-black text-ink">${escapeHtml(section.title)}</h3>
                <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-bold text-muted">${section.items.length}</span>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${section.items
                  .map(
                    (img) => `
                  <div class="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div class="aspect-square bg-slate-100">
                      <img src="${escapeHtml(img.imageUrl)}" alt="${escapeHtml(img.productName)}" class="w-full h-full object-cover" onerror="this.src='/assets/images/smoothie-bowl.jpg'">
                    </div>
                    <div class="p-3">
                      <div class="flex items-center gap-1.5">
                        ${
                          (img.type || "").toLowerCase() === "non-vegetarian"
                            ? '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-red-600 flex items-center justify-center"><span class="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-600"></span></span>'
                            : '<span class="w-4 h-4 shrink-0 rounded-sm border-2 border-green-600 flex items-center justify-center"><span class="w-2 h-2 rounded-full bg-green-600"></span></span>'
                        }
                        <p class="font-bold text-ink text-sm truncate">${escapeHtml(img.productName)}</p>
                      </div>
                      <p class="text-xs text-muted mt-1">${formatBytes(img.size)} &middot; ${fileTypeLabel(img.contentType)}</p>
                      <p class="text-xs text-muted mt-0.5">${dateTime(img.updatedAt || img.createdAt)}</p>
                      <div class="flex gap-3 mt-3">
                        <a href="${escapeHtml(img.imageUrl)}" download="${escapeHtml(img.productName)}.jpg" class="w-9 h-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition"><i data-lucide="download" class="w-5 h-5"></i></a>
                        <button data-gallery-action="replace" data-product-id="${escapeHtml(img.productId)}" class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center justify-center transition"><i data-lucide="refresh-cw" class="w-5 h-5"></i></button>
                        <button data-gallery-action="delete" data-product-id="${escapeHtml(img.productId)}" class="w-9 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                      </div>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
}

document.getElementById("addImageBtn").addEventListener("click", async () => {
  document.getElementById("addImageForm").classList.toggle("hidden");
  const select = document.getElementById("galleryProductSelect");
  select.innerHTML =
    '<option value="">Select a product...</option>' +
    state.products
      .map(
        (p) =>
          `<option value="${escapeHtml(p.productId)}">${escapeHtml(p.name)}</option>`,
      )
      .join("");
});

document.getElementById("cancelImageBtn").addEventListener("click", () => {
  document.getElementById("addImageForm").classList.add("hidden");
});

document
  .getElementById("uploadImageBtn")
  .addEventListener("click", async () => {
    const productId = document.getElementById("galleryProductSelect").value;
    const fileInput = document.getElementById("galleryFileInput");
    if (!productId || !fileInput.files.length) {
      showToast("Select a product and an image file", "warning");
      return;
    }
    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    const res = await fetch(apiUrl(`/api/products/${productId}`), {
      method: "PUT",
      headers: { Authorization: "Bearer " + token() },
      body: formData,
    });
    const data = await readApiJson(res);
    if (!res.ok) {
      showToast(data.error || "Upload failed", "error");
      return;
    }
    document.getElementById("addImageForm").classList.add("hidden");
    fileInput.value = "";
    await loadGallery();
    await loadProducts();
    showToast("Image uploaded successfully");
  });

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-gallery-action]");
  if (!btn) return;
  const action = btn.dataset.galleryAction;
  const productId = btn.dataset.productId;

  if (action === "delete") {
    if (!confirm("Delete this image?")) return;
    const res = await fetch(apiUrl(`/api/products/${productId}/image`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      await loadGallery();
      await loadProducts();
      showToast("Image deleted successfully");
    } else {
      const data = await readApiJson(res);
      showToast(data.error || "Delete failed", "error");
    }
  }

  if (action === "replace") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      if (!input.files.length) return;
      const formData = new FormData();
      formData.append("image", input.files[0]);
      const res = await fetch(apiUrl(`/api/products/${productId}`), {
        method: "PUT",
        headers: { Authorization: "Bearer " + token() },
        body: formData,
      });
      if (res.ok) {
        await loadGallery();
        await loadProducts();
        showToast("Image replaced successfully");
      } else {
        const data = await readApiJson(res);
        showToast(data.error || "Replace failed", "error");
      }
    };
    input.click();
  }
});

refreshAll().catch((err) => {
  showToast(err.message, "error");
});

setTimeout(() => {
  if (window.lucide) lucide.createIcons();
}, 500);

// Initialize Lucide icons for static gallery elements
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) lucide.createIcons();
});

// ========== Database Detail Modals ==========
(function initDbModals() {
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "dbDetailModal";
  modalOverlay.className =
    "hidden fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4";
  modalOverlay.innerHTML = `<div class="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
      <h2 id="dbModalTitle" class="text-xl font-bold text-slate-900"></h2>
      <button id="dbModalClose" class="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"><i class="bi bi-x-lg text-lg text-slate-600"></i></button>
    </div>
    <div id="dbModalBody" class="flex-1 overflow-y-auto p-6"></div>
  </div>`;
  document.body.appendChild(modalOverlay);

  const modalTitle = document.getElementById("dbModalTitle");
  const modalBody = document.getElementById("dbModalBody");
  function openModal(t, h) {
    modalTitle.textContent = t;
    modalBody.innerHTML = h;
    modalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (window.lucide)
      setTimeout(() => lucide.createIcons({ nodes: [modalBody] }), 10);
  }
  function closeModal() {
    modalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
  document.getElementById("dbModalClose").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalOverlay.classList.contains("hidden"))
      closeModal();
  });

  let dbCache = null,
    schemasCache = null;
  async function fetchDbDetails(force) {
    if (dbCache && !force) return dbCache;
    const r = await fetch(apiUrl("/api/admins/database/details"), {
      headers: authHeaders(),
    });
    if (!r.ok) throw new Error("Load failed");
    dbCache = await r.json();
    return dbCache;
  }
  async function fetchSchemas() {
    if (schemasCache) return schemasCache;
    const r = await fetch(apiUrl("/api/admins/database/schemas"), {
      headers: authHeaders(),
    });
    if (r.ok) schemasCache = await r.json();
    return schemasCache || {};
  }
  function invalidateCache() {
    dbCache = null;
  }

  // Helpers
  function fmtDate(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
  }
  function fmtTime(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }
  function fmtDateTime(v) {
    const date = fmtDate(v);
    const time = fmtTime(v);
    return time ? `${date} ${time}` : date;
  }

  const colIcons = {
    users: "bi-people-fill",
    admins: "bi-shield-lock-fill",
    products: "bi-box-seam-fill",
    orders: "bi-receipt",
    payments: "bi-credit-card-2-front-fill",
    carts: "bi-cart3",
    addresses: "bi-geo-alt-fill",
    productimages: "bi-image-fill",
    userpayments: "bi-wallet-fill",
  };
  function colIcon(name) {
    return (
      colIcons[name.toLowerCase().replace(/[^a-z]/g, "")] || "bi-database-fill"
    );
  }

  const palette = [
    {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      icon: "text-emerald-500",
      badge: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-400",
    },
    {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: "text-blue-500",
      badge: "bg-blue-100 text-blue-700",
      bar: "bg-blue-400",
    },
    {
      bg: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
      icon: "text-violet-500",
      badge: "bg-violet-100 text-violet-700",
      bar: "bg-violet-400",
    },
    {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      icon: "text-amber-500",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
    },
    {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      icon: "text-rose-500",
      badge: "bg-rose-100 text-rose-700",
      bar: "bg-rose-400",
    },
    {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-700",
      icon: "text-cyan-500",
      badge: "bg-cyan-100 text-cyan-700",
      bar: "bg-cyan-400",
    },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-700",
      icon: "text-indigo-500",
      badge: "bg-indigo-100 text-indigo-700",
      bar: "bg-indigo-400",
    },
    {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      icon: "text-orange-500",
      badge: "bg-orange-100 text-orange-700",
      bar: "bg-orange-400",
    },
  ];

  // Confirmation modal with customizable icon/color per action type
  function confirmAction(msg, options) {
    const opts = options || {};
    const icon = opts.icon || "trash-2";
    const iconBg = opts.iconBg || "bg-red-100";
    const iconColor = opts.iconColor || "text-red-600";
    const btnBg = opts.btnBg || "bg-red-600 hover:bg-red-700";
    const btnText = opts.btnText || "Confirm";
    const btnIcon = opts.btnIcon || icon;
    return new Promise((resolve) => {
      const d = document.createElement("div");
      d.className =
        "fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4";
      d.innerHTML = `<div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"><div class="flex items-start gap-3 mb-4"><span class="w-10 h-10 shrink-0 rounded-xl ${iconBg} flex items-center justify-center"><i data-lucide="${icon}" class="w-5 h-5 ${iconColor}"></i></span><p class="text-sm text-slate-700 mt-2">${msg}</p></div><div class="flex justify-end gap-3"><button id="_cCancel" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button><button id="_cOk" class="px-4 py-2 rounded-xl ${btnBg} text-white font-semibold transition flex items-center gap-1.5"><i data-lucide="${btnIcon}" class="w-4 h-4"></i>${btnText}</button></div></div>`;
      document.body.appendChild(d);
      if (window.lucide) lucide.createIcons({ nodes: [d] });
      d.querySelector("#_cCancel").onclick = () => {
        d.remove();
        resolve(false);
      };
      d.querySelector("#_cOk").onclick = () => {
        d.remove();
        resolve(true);
      };
      d.addEventListener("click", (e) => {
        if (e.target === d) {
          d.remove();
          resolve(false);
        }
      });
    });
  }

  // Beautiful form modal for create/edit
  // Generate real unique IDs from the backend
  async function generateRealIds(colName) {
    try {
      const r = await fetch(
        apiUrl(`/api/admins/database/generate-id/${colName}`),
        { headers: authHeaders() },
      );
      if (r.ok) return await r.json();
    } catch (e) {}
    return {};
  }

  function formModal(title, fields, values, onSave, generatedIds) {
    generatedIds = generatedIds || {};
    const d = document.createElement("div");
    d.className =
      "fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4";

    let formHtml = `<div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h3 class="text-lg font-bold text-slate-900">${title}</h3>
        <button class="fm-close w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><i class="bi bi-x-lg text-slate-600"></i></button>
      </div>
      <div class="flex-1 overflow-y-auto p-6"><div class="space-y-4">`;
    fields.forEach((f) => {
      let val =
        values[f.key] !== undefined && values[f.key] !== null
          ? values[f.key]
          : f.default || "";
      // Show backend-generated ID for new documents
      if (f.autoGenerate && !val && generatedIds[f.key])
        val = generatedIds[f.key];
      const disabled = f.autoGenerate ? "disabled" : "";
      const hint = f.autoGenerate
        ? '<p class="text-[10px] text-emerald-600 mt-1"><i class="bi bi-lock-fill mr-1"></i>Real unique ID · saved only when you click Save</p>'
        : "";
      const disabledClasses = f.autoGenerate
        ? "bg-slate-50 text-slate-600 cursor-not-allowed font-mono"
        : "";
      if (f.type === "Boolean") {
        formHtml += `<label class="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary/50 transition cursor-pointer">
          <input type="checkbox" name="${f.key}" ${val === true || val === "true" ? "checked" : ""} class="w-5 h-5 rounded accent-emerald-500">
          <span class="text-sm font-medium text-slate-700">${f.key}</span>
        </label>`;
      } else if (f.type === "Select") {
        const options = f.options || [];
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key}</label><select name="${f.key}" class="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm transition bg-white"><option value="">Select...</option>`;
        options.forEach((opt) => {
          formHtml += `<option value="${escapeHtml(opt)}" ${String(val) === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`;
        });
        formHtml += `</select></div>`;
      } else if (f.type === "Textarea") {
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key}</label><textarea name="${f.key}" rows="3" class="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm transition" placeholder="${escapeHtml(f.placeholder || "")}">${escapeHtml(String(val || ""))}</textarea></div>`;
      } else if (f.type === "File") {
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key}${f.required ? ' <span class="text-red-400">*</span>' : ""}</label>
          <div class="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-primary/50 transition cursor-pointer relative">
            <input type="file" name="${f.key}" accept="image/jpeg,image/png,image/webp" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <div class="fm-file-preview-${f.key}"><i class="bi bi-cloud-upload text-3xl text-slate-400"></i><p class="text-sm text-slate-500 mt-2">Click or drag image here</p><p class="text-[10px] text-slate-400">JPEG, PNG, WebP</p></div>
          </div></div>`;
      } else if (f.type === "Date") {
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key}</label><input type="text" name="${f.key}" value="${escapeHtml(val ? fmtDateTime(val) : "")}" placeholder="Auto" class="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm transition ${disabledClasses}" ${disabled}>${hint}</div>`;
      } else if (typeof val === "object" && val !== null) {
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key} <span class="text-slate-400">(JSON)</span></label><textarea name="${f.key}" rows="3" class="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm font-mono transition">${escapeHtml(JSON.stringify(val, null, 2))}</textarea></div>`;
      } else {
        formHtml += `<div><label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${f.key}${f.required ? ' <span class="text-red-400">*</span>' : ""}</label><input type="${f.type === "Number" ? "number" : "text"}" name="${f.key}" value="${escapeHtml(String(val))}" placeholder="${escapeHtml(f.placeholder || "")}" class="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:outline-none text-sm transition ${disabledClasses}" ${disabled}>${hint}</div>`;
      }
    });
    formHtml += `</div></div>
      <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
        <button class="fm-close px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition">Cancel</button>
        <button class="fm-save px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition"><i class="bi bi-check-lg mr-1"></i>Save</button>
      </div></div>`;
    d.innerHTML = formHtml;
    document.body.appendChild(d);
    d.querySelectorAll(".fm-close").forEach(
      (b) => (b.onclick = () => d.remove()),
    );
    d.addEventListener("click", (e) => {
      if (e.target === d) d.remove();
    });
    // File input preview
    d.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files[0];
        const previewContainer = d.querySelector(
          `.fm-file-preview-${input.name}`,
        );
        if (file && previewContainer) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            previewContainer.innerHTML = `<img src="${ev.target.result}" class="max-h-32 mx-auto rounded-lg object-contain"><p class="text-xs text-slate-500 mt-2">${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)</p>`;
          };
          reader.readAsDataURL(file);
        }
      });
    });
    d.querySelector(".fm-save").onclick = () => {
      const result = {};
      let hasFile = false;
      fields.forEach((f) => {
        const el = d.querySelector(`[name="${f.key}"]`);
        if (!el) return;
        if (f.autoGenerate) {
          result[f.key] = el.value;
          return;
        }
        if (f.type === "File") {
          if (el.files && el.files[0]) {
            result[f.key] = el.files[0];
            hasFile = true;
          }
          return;
        }
        if (f.type === "Boolean") {
          result[f.key] = el.checked;
        } else if (f.type === "Number") {
          result[f.key] = Number(el.value) || 0;
        } else if (
          typeof values[f.key] === "object" &&
          values[f.key] !== null
        ) {
          try {
            result[f.key] = JSON.parse(el.value);
          } catch (e) {
            result[f.key] = el.value;
          }
        } else {
          result[f.key] = el.value;
        }
      });
      result._hasFile = hasFile;
      d.remove();
      onSave(result);
    };
  }

  // Fields that are system-managed and should never appear in forms
  const SYSTEM_FIELDS = [
    "_createdBy",
    "_lastUpdatedBy",
    "checksum",
    "__v",
    "passwordHash",
    "data",
  ];

  function getFieldsForCollection(colName, schemas, existingDoc) {
    const colLower = colName.toLowerCase().replace(/[^a-z]/g, "");

    // Special handling for products — match the Product Editor form exactly
    if (colLower === "products") {
      const base = [
        { key: "productId", type: "String", autoGenerate: !existingDoc },
        { key: "productCode", type: "String", autoGenerate: !existingDoc },
        {
          key: "name",
          type: "String",
          required: true,
          placeholder: "Green Goddess",
        },
        { key: "price", type: "Number", required: true, placeholder: "250" },
        {
          key: "category",
          type: "Select",
          options: [
            "Smoothies",
            "Seasonal Fruit Juices / Smoothies",
            "Salads",
            "Protein Bowls",
            "Healthy Snacks",
            "Ice Creams & Gelato",
            "Cold-Pressed Juices",
          ],
        },
        {
          key: "type",
          type: "Select",
          options: ["Vegetarian", "Non-Vegetarian"],
          default: "Vegetarian",
        },
        {
          key: "description",
          type: "Textarea",
          placeholder: "Fresh ingredients, flavor profile, and serving notes.",
        },
        { key: "calories", type: "Number", meta: true, placeholder: "120" },
        { key: "protein", type: "Number", meta: true, placeholder: "5" },
        { key: "carbs", type: "Number", meta: true, placeholder: "25" },
        { key: "fat", type: "Number", meta: true, placeholder: "3" },
        { key: "fiber", type: "Number", meta: true, placeholder: "4" },
        { key: "sugar", type: "Number", meta: true, placeholder: "18" },
        {
          key: "ingredients",
          type: "String",
          meta: true,
          placeholder: "Spinach, Kale, Banana",
        },
        { key: "image", type: "File" },
        {
          key: "imageUrl",
          type: "String",
          placeholder: "Optional: paste image URL",
        },
        { key: "isFeatured", type: "Boolean" },
        { key: "featuredOrder", type: "Number", placeholder: "1 to 6" },
        { key: "isArchived", type: "Boolean" },
        { key: "isOutOfStock", type: "Boolean" },
      ];
      return base;
    }

    // Special handling for productimages — image upload
    if (colLower === "productimages") {
      return [
        { key: "productId", type: "String", required: true },
        { key: "productName", type: "String" },
        { key: "image", type: "File", required: true },
      ];
    }

    const schema = schemas[colName];
    if (schema && schema.fields) {
      return Object.entries(schema.fields)
        .filter(([key]) => !SYSTEM_FIELDS.includes(key))
        .map(([key, info]) => ({
          key,
          type: info.type,
          required: info.required,
          default: info.default,
          autoGenerate:
            (key.endsWith("Id") && key !== "userId" && !existingDoc) ||
            key === "productCode",
        }));
    }
    // Fallback: use keys from existing doc
    if (existingDoc)
      return Object.keys(existingDoc)
        .filter((k) => k !== "_id" && !SYSTEM_FIELDS.includes(k))
        .map((k) => ({
          key: k,
          type:
            typeof existingDoc[k] === "boolean"
              ? "Boolean"
              : typeof existingDoc[k] === "number"
                ? "Number"
                : "String",
        }));
    return [{ key: "data", type: "String" }];
  }

  // ===== Display value with tooltip for long text =====
  function displayVal(val, key) {
    if (val === null || val === undefined)
      return '<span class="text-slate-300 italic">null</span>';
    if (typeof val === "boolean")
      return val
        ? '<span class="text-emerald-600 font-semibold">true</span>'
        : '<span class="text-red-500 font-semibold">false</span>';
    if (
      val instanceof Date ||
      (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val))
    )
      return `<span class="text-slate-700">${fmtDateTime(val)}</span>`;
    // Render _createdBy / _lastUpdatedBy as readable admin name
    if (
      (key === "_createdBy" || key === "_lastUpdatedBy") &&
      typeof val === "object"
    ) {
      const name = val.name || val.adminId || "-";
      const at = val.at ? fmtDateTime(val.at) : "";
      return `<span class="inline-flex items-center gap-1 text-slate-700"><span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-semibold">${escapeHtml(name)}</span>${at ? '<span class="text-[10px] text-slate-400">' + at + "</span>" : ""}</span>`;
    }
    if (typeof val === "object") {
      const json = JSON.stringify(val, null, 2);
      const jsonFlat = JSON.stringify(val);
      const short =
        jsonFlat.length > 60 ? jsonFlat.slice(0, 60) + "..." : jsonFlat;
      if (jsonFlat.length > 60)
        return `<span class="text-slate-500 italic text-xs truncate inline-block max-w-[200px] align-bottom cursor-help" data-tip="${escapeHtml(json)}">${escapeHtml(short)}</span>`;
      return `<span class="text-slate-500 italic text-xs">${escapeHtml(short)}</span>`;
    }
    const s = String(val);
    if (s.length > 60)
      return `<span class="text-slate-800 truncate inline-block max-w-[200px] align-bottom cursor-help" data-tip="${escapeHtml(s)}">${escapeHtml(s.slice(0, 60))}\u2026</span>`;
    return escapeHtml(s);
  }

  // ===== Collections Modal =====
  function renderCollectionsModal(data) {
    const cols = data.collections || [];
    const totalDocs = cols.reduce((s, c) => s + c.documents, 0);
    const totalStorage = cols.reduce((s, c) => s + c.storageSize, 0);
    let html = `<div class="grid grid-cols-3 gap-3 mb-6">
      <div class="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-5 text-center">
        <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-200/60 flex items-center justify-center"><i class="bi bi-layers-fill text-xl text-emerald-700"></i></div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-1">Collections</p>
        <p class="text-2xl font-black text-slate-900">${cols.length}</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-5 text-center">
        <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-200/60 flex items-center justify-center"><i class="bi bi-file-earmark-text-fill text-xl text-blue-700"></i></div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Total Documents</p>
        <p class="text-2xl font-black text-slate-900">${totalDocs.toLocaleString()}</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 p-5 text-center">
        <div class="w-10 h-10 mx-auto mb-2 rounded-xl bg-orange-200/60 flex items-center justify-center"><i class="bi bi-device-hdd-fill text-xl text-orange-700"></i></div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-1">Total Storage</p>
        <p class="text-2xl font-black text-slate-900">${formatBytes(totalStorage)}</p>
      </div>
    </div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4">`;
    cols
      .sort((a, b) => b.documents - a.documents)
      .forEach((c, i) => {
        const color = palette[i % palette.length];
        const pct =
          totalDocs > 0 ? Math.round((c.documents / totalDocs) * 100) : 0;
        html += `<div class="rounded-2xl border ${color.border} ${color.bg} p-5 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${color.badge} flex items-center justify-center"><i class="bi ${colIcon(c.name)} text-lg"></i></div>
            <div><h4 class="font-bold text-slate-900 text-sm">${escapeHtml(c.name)}</h4><p class="text-[11px] text-slate-500">${pct}% of total docs</p></div>
          </div>
          <button class="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition" data-crud-drop="${escapeHtml(c.name)}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
        <div class="h-3 rounded-full bg-white/80 mb-3 overflow-hidden shadow-inner"><div class="h-full rounded-full ${color.bar}" style="width:${Math.max(4, pct)}%"></div></div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div><p class="text-lg font-black text-slate-900">${c.documents.toLocaleString()}</p><p class="text-[10px] text-slate-500 uppercase">Docs</p></div>
          <div><p class="text-lg font-black text-slate-900">${formatBytes(c.storageSize)}</p><p class="text-[10px] text-slate-500 uppercase">Storage</p></div>
          <div><p class="text-lg font-black text-slate-900">${formatBytes(c.avgDocSize)}</p><p class="text-[10px] text-slate-500 uppercase">Avg Size</p></div>
        </div>
      </div>`;
      });
    html += `</div>`;
    openModal("Collections", html);
  }

  // ===== Users Modal =====
  function renderUsersModal(data) {
    const users = data.users || [];
    let html = `<div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">${users.length} registered user(s)</p>
      <button class="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition" data-crud-create-user><i data-lucide="user-plus" class="w-3.5 h-3.5 mr-1 inline-block"></i>New User</button>
    </div>`;
    html += `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-slate-200 text-left text-slate-500">
      <th class="py-2 pr-3 font-semibold">User ID</th><th class="py-2 pr-3 font-semibold">Name</th><th class="py-2 pr-3 font-semibold">Email</th><th class="py-2 pr-3 font-semibold">Phone</th><th class="py-2 pr-3 font-semibold">Status</th><th class="py-2 pr-3 font-semibold">Joined</th><th class="py-2 font-semibold text-right">Actions</th>
    </tr></thead><tbody>`;
    users.forEach((u) => {
      const active = u.isActive !== false;
      html += `<tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="py-3 pr-3 font-mono text-sm text-slate-700">${escapeHtml(u.userId || "-")}</td>
        <td class="py-3 pr-3 font-semibold text-slate-800">${escapeHtml(u.name || "-")}</td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(u.email || "-")}</td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(u.phone || u.phoneNumber || "-")}</td>
        <td class="py-3 pr-3">${active ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>' : '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>'}</td>
        <td class="py-3 pr-3 text-slate-600 text-xs">${fmtDate(u.createdAt)}</td>
        <td class="py-3 text-right whitespace-nowrap">
          <button class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 mr-1" data-crud-edit-user="${escapeHtml(u.userId)}"><i data-lucide="square-pen" class="w-3.5 h-3.5"></i></button>
          <button class="text-xs px-2 py-1 rounded ${active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"} mr-1" data-crud-toggle-user="${escapeHtml(u.userId)}" data-active="${active}"><i data-lucide="${active ? "user-x" : "user-check"}" class="w-3.5 h-3.5"></i></button>
          <button class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200" data-crud-delete-user="${escapeHtml(u.userId)}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </td></tr>`;
    });
    html += `</tbody></table></div>`;
    openModal("Users", html);
  }

  // ===== Admins Modal =====
  function renderAdminsModal(data) {
    const admins = data.admins || [];
    let html = `<div class="flex items-center justify-between mb-4">
      <p class="text-sm text-slate-500">${admins.length} admin(s)</p>
      <button class="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-200 transition" data-crud-create-admin><i data-lucide="shield-plus" class="w-3.5 h-3.5 mr-1 inline-block"></i>New Admin</button>
    </div>`;
    html += `<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-slate-200 text-left text-slate-500">
      <th class="py-2 pr-3 font-semibold">Admin ID</th><th class="py-2 pr-3 font-semibold">Name</th><th class="py-2 pr-3 font-semibold">Email</th><th class="py-2 pr-3 font-semibold">Role</th><th class="py-2 pr-3 font-semibold">Status</th><th class="py-2 pr-3 font-semibold">Created</th><th class="py-2 pr-3 font-semibold">Created By</th><th class="py-2 font-semibold text-right">Actions</th>
    </tr></thead><tbody>`;
    admins.forEach((a) => {
      const active = a.isActive !== false;
      const createdBy = a._createdBy
        ? a._createdBy.name || a._createdBy.adminId || "-"
        : "-";
      html += `<tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="py-3 pr-3 font-mono text-sm text-slate-700">${escapeHtml(a.adminId || "-")}</td>
        <td class="py-3 pr-3 font-semibold text-slate-800">${escapeHtml(a.name || "-")}</td>
        <td class="py-3 pr-3 text-slate-700">${escapeHtml(a.email || "-")}</td>
        <td class="py-3 pr-3"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">${escapeHtml(a.role || "admin")}</span></td>
        <td class="py-3 pr-3">${active ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>' : '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>'}</td>
        <td class="py-3 pr-3 text-slate-600 text-xs">${fmtDate(a.createdAt)}</td>
        <td class="py-3 pr-3 text-slate-600 text-xs">${escapeHtml(createdBy)}</td>
        <td class="py-3 text-right whitespace-nowrap">
          <button class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 mr-1" data-crud-edit-admin="${escapeHtml(a.adminId)}"><i data-lucide="square-pen" class="w-3.5 h-3.5"></i></button>
          <button class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200" data-crud-delete-admin="${escapeHtml(a.adminId)}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </td></tr>`;
    });
    html += `</tbody></table></div>`;
    openModal("Admins", html);
  }

  // ===== Documents Modal =====
  function renderDocumentsModal(data, scrollTo) {
    const docs = data.documentsByCollection || {};
    const names = Object.keys(docs).sort();
    const total = names.reduce((s, n) => s + (docs[n] || []).length, 0);
    let html = `<div class="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
      <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center"><i class="bi bi-file-earmark-text-fill text-2xl text-blue-600"></i></div>
      <div><p class="text-sm text-slate-500">All documents across collections</p><p class="text-lg font-bold text-slate-900">${names.length} collections · ${total} documents</p></div>
    </div><div class="flex flex-wrap gap-2 mb-5">`;
    names.forEach((n, i) => {
      const c = palette[i % palette.length];
      html += `<button class="px-3 py-1.5 rounded-full text-xs font-semibold border ${c.border} ${c.bg} ${c.text} hover:shadow-sm hover:scale-105 transition-all" data-scroll-col="${escapeHtml(n)}"><i class="bi ${colIcon(n)} mr-1"></i>${escapeHtml(n)} (${(docs[n] || []).length})</button>`;
    });
    html += `</div><div class="space-y-4">`;
    names.forEach((colName, ci) => {
      const items = docs[colName] || [];
      const c = palette[ci % palette.length];
      const isOpen = scrollTo === colName;
      html += `<div class="doc-sec rounded-2xl border ${c.border} overflow-hidden" id="dsec-${escapeHtml(colName)}"><details class="group" ${isOpen ? "open" : ""}>
        <summary class="flex items-center justify-between px-5 py-4 ${c.bg} cursor-pointer select-none hover:brightness-95 transition">
          <span class="flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm"><i class="bi ${colIcon(colName)} ${c.icon}"></i></span><span class="font-bold text-slate-900">${escapeHtml(colName)}</span><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge} border ${c.border}">${items.length}</span></span>
          <div class="flex items-center gap-2"><button class="text-xs px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition" data-crud-add-doc="${escapeHtml(colName)}"><i data-lucide="file-plus" class="w-3.5 h-3.5 mr-1 inline-block"></i>Add</button><i class="bi bi-chevron-down ${c.icon} text-sm group-open:rotate-180 transition-transform"></i></div>
        </summary><div class="px-5 py-4 max-h-[500px] overflow-y-auto">`;
      if (!items.length) {
        html += `<div class="text-center py-8 text-slate-400"><i class="bi bi-inbox text-3xl"></i><p class="text-sm mt-2">Empty</p></div>`;
      } else {
        html += `<div class="space-y-3">`;
        items.forEach((doc, di) => {
          const title =
            doc.name ||
            doc.email ||
            doc.orderId ||
            doc.productId ||
            doc.userId ||
            doc._id;
          const fields = Object.entries(doc).filter(([k]) => k !== "_id");
          const visibleCount = 10;
          const hasMore = fields.length > visibleCount;
          const docUid = `doc_${ci}_${di}`;

          html += `<div class="rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <span class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-md ${c.bg} ${c.text} flex items-center justify-center text-[10px] font-black">${di + 1}</span>
                <span class="font-semibold text-sm text-slate-800 truncate max-w-[200px]" data-tip="${escapeHtml(String(title))}">${escapeHtml(String(title).slice(0, 40))}</span>
              </span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[13px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg cursor-help select-all">${escapeHtml(doc._id)}</span>
                <button class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" data-crud-edit-doc="${escapeHtml(colName)}|${escapeHtml(doc._id)}"><i data-lucide="square-pen" class="w-3.5 h-3.5"></i></button>
                <button class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200" data-crud-delete-doc="${escapeHtml(colName)}|${escapeHtml(doc._id)}"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
              </div>
            </div>
            <div class="p-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">`;
          fields.slice(0, visibleCount).forEach(([key, val]) => {
            html += `<div class="flex items-baseline gap-2 py-1 border-b border-dashed border-slate-100"><span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-28 shrink-0 truncate">${escapeHtml(key)}</span><span class="text-slate-800 text-sm truncate flex-1">${displayVal(val, key)}</span></div>`;
          });
          html += `</div>`;
          if (hasMore) {
            html += `<div id="${docUid}_more" class="hidden mt-2"><div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm border-t border-slate-100 pt-2">`;
            fields.slice(visibleCount).forEach(([key, val]) => {
              html += `<div class="flex items-baseline gap-2 py-1 border-b border-dashed border-slate-100"><span class="text-xs font-semibold text-slate-500 uppercase tracking-wide w-28 shrink-0 truncate">${escapeHtml(key)}</span><span class="text-slate-800 text-sm truncate flex-1">${displayVal(val, key)}</span></div>`;
            });
            html += `</div></div>`;
            html += `<button class="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition" data-toggle-more="${docUid}">+ ${fields.length - visibleCount} more fields <i class="bi bi-chevron-down text-[10px]"></i></button>`;
          }
          html += `</div></div>`;
        });
        html += `</div>`;
      }
      html += `</div></details></div>`;
    });
    html += `</div>`;
    openModal("Documents", html);
    // Scroll & pill handlers
    setTimeout(() => {
      modalBody.querySelectorAll("[data-scroll-col]").forEach(
        (b) =>
          (b.onclick = () => {
            const sec = modalBody.querySelector(`#dsec-${b.dataset.scrollCol}`);
            if (!sec) return;
            const det = sec.querySelector("details");
            if (det && !det.open) det.open = true;
            sec.scrollIntoView({ behavior: "smooth", block: "start" });
            sec.classList.add("ring-2", "ring-primary/40");
            setTimeout(
              () => sec.classList.remove("ring-2", "ring-primary/40"),
              1200,
            );
          }),
      );
      modalBody.querySelectorAll("[data-toggle-more]").forEach(
        (b) =>
          (b.onclick = () => {
            const el = document.getElementById(b.dataset.toggleMore + "_more");
            if (!el) return;
            const hidden = el.classList.toggle("hidden");
            b.innerHTML = hidden
              ? `+ ${b.textContent.match(/\\d+/)?.[0] || ""} more fields <i class="bi bi-chevron-down text-[10px]"></i>`
              : `- collapse <i class="bi bi-chevron-up text-[10px]"></i>`;
          }),
      );
    }, 30);
    if (scrollTo)
      setTimeout(() => {
        const s = modalBody.querySelector(`#dsec-${scrollTo}`);
        if (s) s.scrollIntoView({ behavior: "smooth" });
      }, 80);
  }

  // ===== Storage Modal =====
  function renderStorageModal(data) {
    const breakdown = data.storageBreakdown || [];
    const totals = data.totals || {};
    let html = `<div class="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-xl bg-orange-50 border border-orange-100 p-4 text-center"><p class="text-xs text-slate-500 mb-1">Total Storage</p><p class="font-black text-lg text-slate-900">${formatBytes(totals.storageSize)}</p></div>
      <div class="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center"><p class="text-xs text-slate-500 mb-1">Data Size</p><p class="font-black text-lg text-slate-900">${formatBytes(totals.dataSize)}</p></div>
      <div class="rounded-xl bg-purple-50 border border-purple-100 p-4 text-center"><p class="text-xs text-slate-500 mb-1">Index Size</p><p class="font-black text-lg text-slate-900">${formatBytes(totals.indexSize)}</p></div>
      <div class="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center"><p class="text-xs text-slate-500 mb-1">Collections</p><p class="font-black text-lg text-slate-900">${totals.collections}</p></div>
    </div><h3 class="font-semibold text-slate-800 mb-3">Storage by Collection</h3><div class="space-y-2">`;
    const sorted = [...breakdown].sort((a, b) => b.storageSize - a.storageSize);
    const max = sorted.length ? sorted[0].storageSize : 1;
    sorted.forEach((item) => {
      const pct =
        max > 0 ? Math.max(3, Math.round((item.storageSize / max) * 100)) : 0;
      html += `<div class="flex items-center gap-3"><span class="w-32 text-sm font-medium text-slate-700 truncate shrink-0"><i class="bi ${colIcon(item.name)} mr-1 text-slate-400"></i>${escapeHtml(item.name)}</span><div class="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-end pr-2" style="width:${pct}%"><span class="text-[10px] font-bold text-white">${formatBytes(item.storageSize)}</span></div></div><span class="text-xs text-slate-500 w-16 text-right shrink-0">${item.documents} docs</span></div>`;
    });
    html += `</div>`;
    openModal("Storage Breakdown", html);
  }

  // ===== CRUD Handlers =====
  async function crudDeleteDoc(col, id) {
    if (
      !(await confirmAction(`Delete document <b>${id}</b> from <b>${col}</b>?`))
    )
      return;
    const r = await fetch(
      apiUrl(`/api/admins/database/document/${col}/${id}`),
      { method: "DELETE", headers: authHeaders() },
    );
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error, "error");
      return;
    }
    showToast("Document deleted");
    invalidateCache();
    renderDocumentsModal(await fetchDbDetails(true), col);
  }
  async function crudEditDoc(col, id) {
    const schemas = await fetchSchemas();
    const data = await fetchDbDetails();
    const doc = ((data.documentsByCollection || {})[col] || []).find(
      (d) => d._id === id,
    );
    if (!doc) {
      showToast("Not found", "error");
      return;
    }
    const fields = getFieldsForCollection(col, schemas, doc);
    // For products, flatten meta fields into top-level for the form
    let formValues = doc;
    const colLower = col.toLowerCase().replace(/[^a-z]/g, "");
    if (colLower === "products" && doc.meta && typeof doc.meta === "object") {
      formValues = { ...doc, ...doc.meta };
    }
    formModal(`Edit Document · ${col}`, fields, formValues, async (result) => {
      if (
        !(await confirmAction("Save changes to this document?", {
          icon: "save",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          btnBg: "bg-blue-600 hover:bg-blue-700",
          btnText: "Save",
          btnIcon: "save",
        }))
      )
        return;

      let r;
      // Products: use the products API with multipart
      if (colLower === "products" && doc.productId) {
        const formData = new FormData();
        const metaFields = ["calories", "protein", "carbs", "fat", "fiber", "sugar", "ingredients"];
        const meta = {};
        Object.entries(result).forEach(([k, v]) => {
          if (k === "_hasFile" || k === "imageUrl" || k === "productId" || k === "productCode") return;
          if (v instanceof File) formData.append("image", v);
          else if (metaFields.includes(k)) { if (v !== "" && v !== undefined && v !== 0) meta[k] = isNaN(Number(v)) ? v : Number(v); }
          else if (k === "isFeatured" || k === "isArchived" || k === "isOutOfStock") formData.append(k, v ? "on" : "");
          else formData.append(k, String(v ?? ""));
        });
        if (Object.keys(meta).length) formData.append("meta", JSON.stringify(meta));
        if (!result.image && result.imageUrl) formData.append("image", result.imageUrl);
        r = await fetch(apiUrl(`/api/products/${doc.productId}`), {
          method: "PUT",
          headers: { Authorization: "Bearer " + token() },
          body: formData,
        });
      } else {
        delete result._hasFile;
        r = await fetch(
          apiUrl(`/api/admins/database/document/${col}/${id}`),
          {
            method: "PUT",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(result),
          },
        );
      }
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error, "error");
        return;
      }
      showToast("Document updated");
      invalidateCache();
      renderDocumentsModal(await fetchDbDetails(true), col);
    });
  }
  async function crudAddDoc(col) {
    const schemas = await fetchSchemas();
    const fields = getFieldsForCollection(col, schemas, null);
    // Fetch real unique IDs from backend
    const generatedIds = await generateRealIds(col);
    formModal(
      `New Document · ${col}`,
      fields,
      {},
      async (result) => {
        if (
          !(await confirmAction(`Create new document in <b>${col}</b>?`, {
            icon: "file-plus",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            btnBg: "bg-emerald-600 hover:bg-emerald-700",
            btnText: "Create",
            btnIcon: "file-plus",
          }))
        )
          return;

        const colLower = col.toLowerCase().replace(/[^a-z]/g, "");
        let r;

        // Products: use the products API with multipart if image attached
        if (colLower === "products") {
          const formData = new FormData();
          const metaFields = [
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "sugar",
            "ingredients",
          ];
          const meta = {};
          Object.entries(result).forEach(([k, v]) => {
            if (k === "_hasFile" || k === "imageUrl") return;
            if (v instanceof File) formData.append("image", v);
            else if (metaFields.includes(k)) {
              if (v !== "" && v !== undefined && v !== 0)
                meta[k] = isNaN(Number(v)) ? v : Number(v);
            } else if (
              k === "isFeatured" ||
              k === "isArchived" ||
              k === "isOutOfStock"
            )
              formData.append(k, v ? "on" : "");
            else formData.append(k, String(v ?? ""));
          });
          if (Object.keys(meta).length)
            formData.append("meta", JSON.stringify(meta));
          if (!result.image && result.imageUrl)
            formData.append("image", result.imageUrl);
          r = await fetch(apiUrl("/api/products"), {
            method: "POST",
            headers: { Authorization: "Bearer " + token() },
            body: formData,
          });
        }
        // ProductImages: upload via product image endpoint
        else if (colLower === "productimages") {
          const pid = result.productId;
          if (!pid) {
            showToast("Product ID is required", "error");
            return;
          }
          const formData = new FormData();
          if (result.image instanceof File)
            formData.append("image", result.image);
          else {
            showToast("Image file is required", "error");
            return;
          }
          r = await fetch(apiUrl(`/api/products/${pid}`), {
            method: "PUT",
            headers: { Authorization: "Bearer " + token() },
            body: formData,
          });
        }
        // All other collections: use generic document CRUD
        else {
          delete result._hasFile;
          r = await fetch(apiUrl(`/api/admins/database/document/${col}`), {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(result),
          });
        }

        const d = await r.json();
        if (!r.ok) {
          showToast(d.error, "error");
          return;
        }
        showToast("Document created");
        invalidateCache();
        renderDocumentsModal(await fetchDbDetails(true), col);
      },
      generatedIds,
    );
  }
  async function crudDropCollection(col) {
    if (
      !(await confirmAction(
        `⚠️ DROP collection <b>"${col}"</b>? This permanently deletes ALL documents.`,
      ))
    )
      return;
    const r = await fetch(apiUrl(`/api/admins/database/collection/${col}`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error, "error");
      return;
    }
    showToast(`Collection '${col}' dropped`);
    invalidateCache();
    renderCollectionsModal(await fetchDbDetails(true));
  }
  async function crudDeleteUser(uid) {
    if (
      !(await confirmAction(
        `Delete user <b>${uid}</b>? This cannot be undone.`,
      ))
    )
      return;
    const r = await fetch(apiUrl(`/api/admins/database/user/${uid}`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error, "error");
      return;
    }
    showToast("User deleted");
    invalidateCache();
    renderUsersModal(await fetchDbDetails(true));
  }
  async function crudToggleUser(uid, active) {
    const opts = active
      ? {
          icon: "user-x",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          btnBg: "bg-red-600 hover:bg-red-700",
          btnText: "Deactivate",
          btnIcon: "user-x",
        }
      : {
          icon: "user-check",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          btnBg: "bg-emerald-600 hover:bg-emerald-700",
          btnText: "Activate",
          btnIcon: "user-check",
        };
    if (
      !(await confirmAction(
        `${active ? "Deactivate" : "Activate"} user <b>${uid}</b>?${active ? " They will be logged out immediately." : ""}`,
        opts,
      ))
    )
      return;
    const r = await fetch(apiUrl(`/api/admins/database/user/${uid}`), {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ isActive: !active }),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error, "error");
      return;
    }
    showToast(`User ${active ? "deactivated" : "activated"}`);
    invalidateCache();
    renderUsersModal(await fetchDbDetails(true));
  }
  async function crudEditUser(uid) {
    const data = await fetchDbDetails();
    const user = (data.users || []).find((u) => u.userId === uid);
    if (!user) {
      showToast("User not found", "error");
      return;
    }
    const fields = [
      { key: "name", type: "String", required: true },
      { key: "email", type: "String", required: true },
      { key: "phone", type: "String" },
      { key: "isActive", type: "Boolean" },
    ];
    formModal("Edit User", fields, user, async (result) => {
      if (
        !(await confirmAction("Save changes to this user?", {
          icon: "save",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          btnBg: "bg-blue-600 hover:bg-blue-700",
          btnText: "Save",
          btnIcon: "save",
        }))
      )
        return;
      const r = await fetch(apiUrl(`/api/admins/database/user/${uid}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(result),
      });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error, "error");
        return;
      }
      showToast("User updated");
      invalidateCache();
      renderUsersModal(await fetchDbDetails(true));
    });
  }
  async function crudCreateUser() {
    const fields = [
      { key: "name", type: "String", required: true },
      { key: "email", type: "String", required: true },
      { key: "password", type: "String", required: true },
      { key: "phone", type: "String" },
    ];
    formModal("Create User", fields, {}, async (result) => {
      if (
        !(await confirmAction("Create this new user?", {
          icon: "user-plus",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          btnBg: "bg-emerald-600 hover:bg-emerald-700",
          btnText: "Create",
          btnIcon: "user-plus",
        }))
      )
        return;
      const r = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error, "error");
        return;
      }
      showToast("User created");
      invalidateCache();
      renderUsersModal(await fetchDbDetails(true));
    });
  }

  async function crudDeleteAdmin(aid) {
    if (
      !(await confirmAction(
        `Delete admin <b>${aid}</b>? This cannot be undone.`,
      ))
    )
      return;
    const r = await fetch(apiUrl(`/api/admins/${aid}`), {
      method: "DELETE",
      headers: authHeaders(),
    });
    const d = await r.json();
    if (!r.ok) {
      showToast(d.error, "error");
      return;
    }
    showToast("Admin deleted");
    invalidateCache();
    renderAdminsModal(await fetchDbDetails(true));
  }
  async function crudEditAdmin(aid) {
    const data = await fetchDbDetails();
    const admin = (data.admins || []).find((a) => a.adminId === aid);
    if (!admin) {
      showToast("Admin not found", "error");
      return;
    }
    const fields = [
      { key: "name", type: "String", required: true },
      { key: "email", type: "String", required: true },
      { key: "role", type: "String" },
      { key: "isActive", type: "Boolean" },
    ];
    formModal("Edit Admin", fields, admin, async (result) => {
      if (
        !(await confirmAction("Save changes to this admin?", {
          icon: "save",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          btnBg: "bg-blue-600 hover:bg-blue-700",
          btnText: "Save",
          btnIcon: "save",
        }))
      )
        return;
      const r = await fetch(apiUrl(`/api/admins/${aid}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(result),
      });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error, "error");
        return;
      }
      showToast("Admin updated");
      invalidateCache();
      renderAdminsModal(await fetchDbDetails(true));
    });
  }
  async function crudCreateAdmin() {
    const fields = [
      { key: "name", type: "String", required: true },
      { key: "email", type: "String", required: true },
      { key: "password", type: "String", required: true },
      { key: "role", type: "String" },
    ];
    formModal("Create Admin", fields, { role: "admin" }, async (result) => {
      if (
        !(await confirmAction("Create this new admin?", {
          icon: "shield-plus",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          btnBg: "bg-emerald-600 hover:bg-emerald-700",
          btnText: "Create",
          btnIcon: "shield-plus",
        }))
      )
        return;
      const r = await fetch(apiUrl("/api/admins"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(result),
      });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error, "error");
        return;
      }
      showToast("Admin created");
      invalidateCache();
      renderAdminsModal(await fetchDbDetails(true));
    });
  }

  // ===== Event Delegation =====
  document.addEventListener("click", async (e) => {
    const trigger = e.target.closest("[data-db-modal]");
    if (trigger) {
      const action = trigger.dataset.dbModal;
      modalBody.innerHTML =
        '<div class="flex items-center justify-center py-12"><i class="bi bi-arrow-repeat text-3xl text-slate-400 animate-spin"></i><span class="ml-3 text-slate-500">Loading...</span></div>';
      modalOverlay.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      modalTitle.textContent = action.charAt(0).toUpperCase() + action.slice(1);
      try {
        const data = await fetchDbDetails();
        switch (action) {
          case "collections":
            renderCollectionsModal(data);
            break;
          case "users":
            renderUsersModal(data);
            break;
          case "admins":
            renderAdminsModal(data);
            break;
          case "documents":
            renderDocumentsModal(data);
            break;
          case "storage":
            renderStorageModal(data);
            break;
          default:
            closeModal();
        }
      } catch (err) {
        modalBody.innerHTML = `<div class="text-center py-12 text-red-500"><i class="bi bi-exclamation-triangle text-3xl mb-2"></i><p>${escapeHtml(err.message)}</p></div>`;
        showToast(err.message, "error");
      }
      return;
    }
    const dDoc = e.target.closest("[data-crud-delete-doc]");
    if (dDoc) {
      const [c, i] = dDoc.dataset.crudDeleteDoc.split("|");
      crudDeleteDoc(c, i);
      return;
    }
    const eDoc = e.target.closest("[data-crud-edit-doc]");
    if (eDoc) {
      const [c, i] = eDoc.dataset.crudEditDoc.split("|");
      crudEditDoc(c, i);
      return;
    }
    const aDoc = e.target.closest("[data-crud-add-doc]");
    if (aDoc) {
      crudAddDoc(aDoc.dataset.crudAddDoc);
      return;
    }
    const drop = e.target.closest("[data-crud-drop]");
    if (drop) {
      crudDropCollection(drop.dataset.crudDrop);
      return;
    }
    const dU = e.target.closest("[data-crud-delete-user]");
    if (dU) {
      crudDeleteUser(dU.dataset.crudDeleteUser);
      return;
    }
    const tU = e.target.closest("[data-crud-toggle-user]");
    if (tU) {
      crudToggleUser(tU.dataset.crudToggleUser, tU.dataset.active === "true");
      return;
    }
    const eU = e.target.closest("[data-crud-edit-user]");
    if (eU) {
      crudEditUser(eU.dataset.crudEditUser);
      return;
    }
    const cU = e.target.closest("[data-crud-create-user]");
    if (cU) {
      crudCreateUser();
      return;
    }
    const dA = e.target.closest("[data-crud-delete-admin]");
    if (dA) {
      crudDeleteAdmin(dA.dataset.crudDeleteAdmin);
      return;
    }
    const eA = e.target.closest("[data-crud-edit-admin]");
    if (eA) {
      crudEditAdmin(eA.dataset.crudEditAdmin);
      return;
    }
    const cA = e.target.closest("[data-crud-create-admin]");
    if (cA) {
      crudCreateAdmin();
      return;
    }
  });
})();
