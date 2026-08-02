// --- Block 1 ---
// The profile page reuses the session created on login.html; it never
// asks for credentials itself.
const session = window.GoSmoothieSession;
const tokenKey = session.TOKEN_KEY;
const userKey = session.USER_KEY;

// When the API rejects the stored session, send the visitor to the one
// login screen instead of showing another sign-in prompt here.
session.onInvalidSession = () => session.redirectToLogin("/profile.html");

const profileState = {
  name: "",
  email: "",
  phone: "",
  addresses: [],
  editingAddressId: null,
};

function getToken() {
  return session.getToken();
}
function getUser() {
  return session.getUser();
}
function setUser(u) {
  session.setUser(u);
}
function clearSession() {
  session.clearSession({ keepClientId: false });
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok) throw new Error((data && data.error) || "Request failed");
  return data;
}

function refreshLucideIcons() {
  // No longer needed — all icons use Bootstrap Icons font now.
}

function normalizeAddresses(addresses = []) {
  return addresses
    .map((addr) => ({
      _id:
        addr._id ||
        addr.id ||
        `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      label: (addr.label || "Home").trim(),
      street: (addr.street || "").trim(),
      city: (addr.city || "").trim(),
      zip: (addr.zip || "").trim(),
      notes: (addr.notes || "").trim(),
      isDefault: !!addr.isDefault,
    }))
    .filter((addr) => addr.label || addr.street || addr.city || addr.zip);
}

async function persistProfile(statusEl) {
  const token = getToken();
  const payload = {
    name: profileState.name,
    email: profileState.email,
    phone: profileState.phone,
    addresses: profileState.addresses,
  };
  const data = await apiJson("/api/users/me", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(payload),
  });
  setUser({
    name: data.name,
    email: data.email,
    phone: data.phone || "",
  });
  profileState.name = data.name;
  profileState.email = data.email;
  profileState.phone = data.phone || "";
  profileState.addresses = normalizeAddresses(data.addresses || []);
  if (statusEl) {
    statusEl.className =
      "p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded";
    statusEl.textContent = "Profile updated successfully";
    statusEl.classList.remove("hidden");
  }
  return data;
}

function setAddressFormVisible(visible) {
  const form = document.getElementById("addressForm");
  if (!form) return;
  // The overlay centres its panel with flex, so toggle both classes.
  form.classList.toggle("hidden", !visible);
  form.classList.toggle("flex", visible);
  form.setAttribute("aria-hidden", visible ? "false" : "true");
  // Stop the page behind the modal from scrolling.
  document.body.style.overflow = visible ? "hidden" : "";
}

function closeAddressForm() {
  clearAddressForm();
  setAddressFormVisible(false);
  const status = document.getElementById("addressStatus");
  if (status) status.classList.add("hidden");
}

function setEditProfileVisible(visible) {
  const form = document.getElementById("editForm");
  if (!form) return;
  form.classList.toggle("hidden", !visible);
  form.classList.toggle("flex", visible);
  form.setAttribute("aria-hidden", visible ? "false" : "true");
  document.body.style.overflow = visible ? "hidden" : "";
}

function closeEditProfile() {
  setEditProfileVisible(false);
  const status = document.getElementById("editStatus");
  if (status) status.classList.add("hidden");
}

function clearAddressForm() {
  profileState.editingAddressId = null;
  const ids = [
    "addressLabel",
    "addressStreet",
    "addressCity",
    "addressZip",
    "addressNotes",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const def = document.getElementById("addressDefault");
  if (def) def.checked = false;
  const saveBtn = document.getElementById("saveAddressBtn");
  if (saveBtn) saveBtn.textContent = "Save Address";
}

function openAddressForm(address = null) {
  profileState.editingAddressId = address ? address._id : null;
  const label = document.getElementById("addressLabel");
  const street = document.getElementById("addressStreet");
  const city = document.getElementById("addressCity");
  const zip = document.getElementById("addressZip");
  const notes = document.getElementById("addressNotes");
  const isDefault = document.getElementById("addressDefault");
  const saveBtn = document.getElementById("saveAddressBtn");

  if (label) label.value = address ? address.label : "";
  if (street) street.value = address ? address.street : "";
  if (city) city.value = address ? address.city : "";
  if (zip) zip.value = address ? address.zip : "";
  if (notes) notes.value = address ? address.notes : "";
  if (isDefault) isDefault.checked = address ? !!address.isDefault : false;
  if (saveBtn)
    saveBtn.textContent = address ? "Update Address" : "Save Address";

  const title = document.getElementById("addressFormTitle");
  if (title) title.textContent = address ? "Edit Address" : "Add New Address";

  const status = document.getElementById("addressStatus");
  if (status) status.classList.add("hidden");

  setAddressFormVisible(true);
  const firstField = document.getElementById("addressLabel");
  if (firstField) firstField.focus();
}

// Global modal helper (available to all functions)
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

    if (!modal || !okBtn || !cancelBtn) {
      // Fallback confirm when modal elements are not present
      const choice = confirm(message || title);
      resolve(choice);
      return;
    }

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

function renderAddresses() {
  const list = document.getElementById("addressesList");
  if (!list) return;
  const addresses = profileState.addresses || [];
  if (!addresses.length) {
    list.innerHTML = `
        <div class="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-gray-300 p-5 text-gray-500">
          No saved addresses yet. Add one so checkout can use it.
        </div>
      `;
    return;
  }

  list.innerHTML = addresses
    .map(
      (addr) => `
      <div class="address-tile relative flex-1 min-w-[250px] rounded-xl border-2 p-3.5 ${addr.isDefault ? "border-primary bg-primary/5" : "border-gray-200 bg-white"}" data-address-id="${escapeHtml(addr._id)}">

          <div class="pr-44">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-semibold text-gray-900">${escapeHtml(addr.label || "Address")}</h3>
            </div>
            <p class="text-sm text-gray-700">${escapeHtml(addr.street)}</p>
            <p class="text-sm text-gray-700">${escapeHtml(addr.city)} ${escapeHtml(addr.zip)}</p>
            ${addr.notes ? `<p class="text-sm text-gray-500 mt-1">${escapeHtml(addr.notes)}</p>` : ""}
          </div>
          <div class="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div class="flex h-8 items-center gap-1.5">
              <button data-action="edit" type="button" title="Edit address" aria-label="Edit address" class="inline-flex w-8 h-8 shrink-0 items-center justify-center p-0 rounded-md border border-violet-100 bg-violet-50 hover:bg-violet-100 text-violet-600 transition">
                <i class="bi bi-pencil-square text-sm" aria-hidden="true"></i>
              </button>
              <button data-action="default" type="button" title="${addr.isDefault ? "Unset default" : "Set as default"}" aria-label="${addr.isDefault ? "Unset default" : "Set as default"}" class="inline-flex w-8 h-8 shrink-0 items-center justify-center p-0 rounded border ${addr.isDefault ? "border-green-300 bg-green-50" : "border-green-200 bg-transparent"} hover:bg-green-50 text-green-600 transition">
                <i class="bi bi-house-gear text-base" aria-hidden="true"></i>
              </button>
              <button data-action="delete" type="button" title="Delete address" aria-label="Delete address" class="inline-flex w-8 h-8 shrink-0 items-center justify-center p-0 rounded-md border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition">
                <i class="bi bi-trash3 text-sm" aria-hidden="true"></i>
              </button>
            </div>
            ${addr.isDefault ? '<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><i class="bi bi-patch-check-fill"></i> Default</span>' : ""}
          </div>
      </div>
    `,
    )
    .join("");
  refreshLucideIcons();

  // Edit / default / delete clicks are handled by the delegated
  // listener on #addressesList in showProfile(). Binding them here as
  // well made every action fire twice (Delete confirmed twice, Set
  // Default saved twice), so this function only renders markup.
}

async function showProfile() {
  // Modals are moved to <body> after rendering so animated cards cannot
  // create a containing/stacking context around fixed overlays.
  document
    .querySelectorAll("body > #editForm, body > #addressForm")
    .forEach((modal) => modal.remove());

  const token = getToken();
  if (!token) {
    // Signing in belongs to the login page, so go straight there and
    // come back to the profile afterwards.
    document.getElementById("content").innerHTML = `
        <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <p class="text-gray-700">Taking you to the login page...</p>
        </div>
      `;
    session.redirectToLogin("/profile.html");
    return;
  }

  let me;
  try {
    me = await apiJson("/api/users/me", {
      headers: { Authorization: "Bearer " + token },
    });
  } catch (err) {
    // A rejected session is handled by session.js (it clears the token
    // and redirects to the login page), so only a transport failure
    // reaches this point. Show the cached account meanwhile.
    const cachedUser = getUser();
    if (!cachedUser || (!cachedUser.name && !cachedUser.email)) {
      document.getElementById("content").innerHTML = `
          <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <p class="text-gray-700 mb-4">We could not reach the server. Please check your connection and try again.</p>
            <button type="button" onclick="window.location.reload()" class="inline-block bg-primary text-white px-6 py-2 !rounded-button font-semibold hover:bg-green-600 transition">Retry</button>
          </div>
        `;
      return;
    }
    me = cachedUser;
  }

  profileState.name = me.name || "";
  profileState.email = me.email || "";
  profileState.phone = me.phone || "";
  profileState.addresses = normalizeAddresses(me.addresses || []);
  setUser({
    name: profileState.name,
    email: profileState.email,
    phone: profileState.phone,
  });

  document.getElementById("content").innerHTML = `
      <div class="profile-card bg-white rounded-[2rem] border border-green-100 p-6 md:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-1">Personal details</p>
            <h2 class="text-2xl font-bold text-gray-900">Account Information</h2>
          </div>
          <button id="editBtn" class="inline-flex w-9 h-9 shrink-0 items-center justify-center p-0 rounded-md border border-green-100 bg-green-50 hover:bg-green-100 text-green-600 transition" title="Edit Profile" aria-label="Edit Profile">
            <i class="bi bi-pencil-square text-sm" aria-hidden="true"></i>
          </button>
        </div>

        <div id="viewForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="info-tile rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
              <p class="text-lg font-bold text-gray-900 mt-2 break-words">${escapeHtml(profileState.name)}</p>
            </div>
            <div class="info-tile rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Email Address</label>
              <p class="text-lg font-bold text-gray-900 mt-2 break-words">${escapeHtml(profileState.email)}</p>
            </div>
            <div class="info-tile rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <label class="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone Number</label>
              <p class="text-lg font-bold text-gray-900 mt-2 break-words">${escapeHtml(profileState.phone || "-")}</p>
            </div>
          </div>
        </div>

        <div id="editForm" class="hidden fixed inset-0 z-[100] items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4" aria-hidden="true">
          <div role="dialog" aria-modal="true" aria-labelledby="editProfileTitle" class="modal-panel bg-white w-full max-w-xl rounded-[2rem] shadow-2xl border border-green-100 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-4 mb-6">
            <h3 id="editProfileTitle" class="text-xl font-semibold text-gray-900">Edit Profile</h3>
            <button id="closeEditBtn" type="button" aria-label="Close" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition shrink-0">
              <i class="bi bi-x text-xl"></i>
            </button>
          </div>
          <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input id="editName" type="text" value="${escapeHtml(profileState.name)}" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input id="editEmail" type="email" value="${escapeHtml(profileState.email)}" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input id="editPhone" type="tel" value="${escapeHtml(profileState.phone)}" placeholder="Phone number" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
          </div>
          <div id="editStatus" class="hidden p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm rounded"></div>
          </div>
          <div class="mt-6 pt-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button id="cancelBtn" class="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-800 !rounded-button font-semibold hover:bg-gray-200 transition">Cancel</button>
            <button id="saveBtn" class="w-full sm:w-auto px-6 py-3 bg-primary text-white !rounded-button font-semibold hover:bg-green-600 transition">Save Changes</button>
          </div>
          </div>
        </div>
      </div>

      <div class="profile-card bg-white rounded-[2rem] border border-green-100 p-6 md:p-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary mb-1">Delivery</p>
            <h2 class="text-2xl font-bold text-gray-900">Saved Addresses</h2>
          </div>
          <button id="addAddressBtn" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white !rounded-button font-semibold hover:bg-green-600 transition shadow-sm">
            <i class="bi bi-plus-square text-sm" aria-hidden="true"></i> Add Address
          </button>
        </div>
        <div id="addressesList" class="flex flex-wrap gap-4"></div>

        <!-- Address add/edit modal. Field ids are unchanged so the existing
             open/clear/save logic keeps working as-is. -->
        <div id="addressForm" class="hidden fixed inset-0 z-[100] items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4" aria-hidden="true">
          <div role="dialog" aria-modal="true" aria-labelledby="addressFormTitle" class="modal-panel bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-green-100 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-4 mb-6">
            <h3 class="text-xl font-semibold text-gray-900" id="addressFormTitle">Add New Address</h3>
            <button id="closeAddressBtn" type="button" aria-label="Close" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition shrink-0">
              <i class="bi bi-x text-xl"></i>
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Label</label>
              <input id="addressLabel" type="text" placeholder="Home / Work / Other" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input id="addressZip" type="text" placeholder="500032" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
            <input id="addressStreet" type="text" placeholder="Street / Building / Area" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input id="addressCity" type="text" placeholder="Hyderabad" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
            </div>
            <div class="flex items-end gap-3">
              <label class="inline-flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg w-full">
                <input id="addressDefault" type="checkbox" class="custom-radio">
                <span class="text-sm font-medium text-gray-700">Set as default</span>
              </label>
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea id="addressNotes" rows="3" placeholder="Landmark, floor, delivery instructions" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition"></textarea>
          </div>
          <div id="addressStatus" class="hidden mt-4 p-3 text-sm rounded"></div>
          <!-- Footer: primary action sits right on desktop and on top when
               stacked on mobile (flex-col-reverse inverts the DOM order). -->
          <div class="mt-6 pt-5 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button id="cancelAddressBtn" class="w-full sm:w-auto sm:min-w-[120px] px-6 py-3 bg-gray-100 text-gray-800 !rounded-button font-semibold hover:bg-gray-200 transition">Cancel</button>
            <button id="saveAddressBtn" class="w-full sm:w-auto sm:min-w-[160px] px-6 py-3 bg-primary text-white !rounded-button font-semibold hover:bg-green-600 transition">Save Address</button>
          </div>
          </div>
        </div>
      </div>

      <!-- Previous Orders Section -->
      <div class="profile-card bg-white rounded-[2rem] border border-blue-100 p-6 md:p-8">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-blue-500 mb-1">Order History</p>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Previous Orders</h2>
        <p class="text-gray-600 text-sm mb-6">View your past orders and billing details.</p>
        <div id="ordersContainer">
          <p class="text-gray-500 text-center py-8">Loading orders...</p>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div id="orderDetailModal" class="hidden fixed inset-0 z-[100] items-center justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4" aria-hidden="true">
        <div role="dialog" aria-modal="true" class="modal-panel bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-blue-100 p-6 md:p-8">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 class="text-xl font-semibold text-gray-900" id="orderDetailTitle">Order Details</h3>
              <p class="text-sm text-gray-500 mt-1" id="orderDetailDate"></p>
            </div>
            <button id="closeOrderDetail" type="button" aria-label="Close" class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition shrink-0">
              <i class="bi bi-x text-xl"></i>
            </button>
          </div>
          <div id="orderDetailContent"></div>
        </div>
      </div>

      <div class="profile-card bg-white rounded-[2rem] border border-orange-100 p-6 md:p-8">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-orange-500 mb-1">Security</p>
        <button id="changePwdToggle" type="button" aria-expanded="false" aria-controls="changePwdBody" class="w-full flex items-center justify-between group">
          <div class="text-left">
            <h2 class="text-2xl font-bold text-gray-900">Change Password</h2>
            <p class="text-gray-600 text-sm mt-1">Use a strong password that you do not use elsewhere.</p>
          </div>
          <i id="changePwdChevron" class="bi bi-chevron-down text-xl text-gray-400 group-hover:text-primary transition-transform duration-300"></i>
        </button>
        <div id="changePwdBody" class="hidden mt-6">
          <div class="space-y-5 max-w-md">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div class="relative">
                <input id="currentPwd" type="password" placeholder="Enter your current password" class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
                <button type="button" data-password-toggle="currentPwd" aria-label="Show password" title="Show password" class="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-primary transition">
                  <i class="bi bi-eye text-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div class="relative">
                <input id="newPwd" type="password" placeholder="Enter new password" class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
                <button type="button" data-password-toggle="newPwd" aria-label="Show password" title="Show password" class="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-primary transition">
                  <i class="bi bi-eye text-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div class="relative">
                <input id="confirmPwd" type="password" placeholder="Confirm new password" class="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary transition">
                <button type="button" data-password-toggle="confirmPwd" aria-label="Show password" title="Show password" class="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-500 hover:text-primary transition">
                  <i class="bi bi-eye text-lg" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div id="passwordStatus" class="hidden p-3 border-l-4 text-sm rounded"></div>
            <button id="changePasswordBtn" class="w-full px-6 py-3 bg-orange-500 text-white !rounded-button font-semibold hover:bg-orange-600 transition">Update Password</button>
          </div>
        </div>
      </div>

      <div class="profile-card bg-white rounded-[2rem] p-6 md:p-8 border border-red-200">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-red-500 mb-1">Account controls</p>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Danger Zone</h2>
        <div class="space-y-6">
          <div>
            <p class="text-gray-600 mb-4">Logging out will clear your cart and session.</p>
            <button id="logout" class="px-6 py-3 bg-red-600 text-white !rounded-button font-semibold hover:bg-red-700 transition">
              <i class="bi bi-box-arrow-right mr-2"></i> Logout
            </button>
          </div>
          <div class="pt-6 border-t border-red-200">
            <p class="text-gray-600 mb-4"><strong>Delete Account:</strong> Permanently delete your account and all associated data including orders and cart history. This action cannot be undone.</p>
            <button id="deleteAccount" class="px-6 py-3 bg-red-700 text-white !rounded-button font-semibold hover:bg-red-800 transition">
              <i class="bi bi-trash3 text-sm mr-2" aria-hidden="true"></i> Delete My Account
            </button>
          </div>
        </div>
      </div>
    `;

  const editBtn = document.getElementById("editBtn");
  const editForm = document.getElementById("editForm");
  const viewForm = document.getElementById("viewForm");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const addAddressBtn = document.getElementById("addAddressBtn");
  const saveAddressBtn = document.getElementById("saveAddressBtn");
  const cancelAddressBtn = document.getElementById("cancelAddressBtn");
  const addressForm = document.getElementById("addressForm");
  const addressesList = document.getElementById("addressesList");
  const addressStatus = document.getElementById("addressStatus");
  const editStatus = document.getElementById("editStatus");
  const passwordStatus = document.getElementById("passwordStatus");

  // Keep fixed overlays outside animated/isolation-enabled cards.
  if (editForm) document.body.appendChild(editForm);
  if (addressForm) document.body.appendChild(addressForm);

  if (editBtn)
    editBtn.addEventListener("click", () => {
      document.getElementById("editName").value = profileState.name;
      document.getElementById("editEmail").value = profileState.email;
      document.getElementById("editPhone").value = profileState.phone;
      setEditProfileVisible(true);
      document.getElementById("editName").focus();
    });
  if (cancelBtn) cancelBtn.addEventListener("click", closeEditProfile);

  const closeEditBtn = document.getElementById("closeEditBtn");
  if (closeEditBtn) closeEditBtn.addEventListener("click", closeEditProfile);
  if (editForm)
    editForm.addEventListener("click", (e) => {
      if (e.target === editForm) closeEditProfile();
    });
  if (addAddressBtn)
    addAddressBtn.addEventListener("click", () => {
      clearAddressForm();
      openAddressForm();
    });
  if (cancelAddressBtn)
    cancelAddressBtn.addEventListener("click", closeAddressForm);

  const closeAddressBtn = document.getElementById("closeAddressBtn");
  if (closeAddressBtn)
    closeAddressBtn.addEventListener("click", closeAddressForm);

  // Click the dimmed backdrop (not the panel) to dismiss.
  if (addressForm)
    addressForm.addEventListener("click", (e) => {
      if (e.target === addressForm) closeAddressForm();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const address = document.getElementById("addressForm");
    if (address && !address.classList.contains("hidden")) closeAddressForm();
    const edit = document.getElementById("editForm");
    if (edit && !edit.classList.contains("hidden")) closeEditProfile();
  });

  if (saveBtn)
    saveBtn.addEventListener("click", async () => {
      const name = document.getElementById("editName").value.trim();
      const email = document.getElementById("editEmail").value.trim();
      const phone = document.getElementById("editPhone").value.trim();
      if (!name || !email) {
        editStatus.className =
          "p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded";
        editStatus.textContent = "Please fill in all fields";
        editStatus.classList.remove("hidden");
        return;
      }
      try {
        profileState.name = name;
        profileState.email = email;
        profileState.phone = phone;
        await persistProfile(editStatus);
        setTimeout(() => {
          closeEditProfile();
          showProfile();
        }, 1200);
      } catch (e) {
        editStatus.className =
          "p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded";
        editStatus.textContent = e.message;
        editStatus.classList.remove("hidden");
      }
    });

  if (saveAddressBtn)
    saveAddressBtn.addEventListener("click", async () => {
      const label = document.getElementById("addressLabel").value.trim();
      const street = document.getElementById("addressStreet").value.trim();
      const city = document.getElementById("addressCity").value.trim();
      const zip = document.getElementById("addressZip").value.trim();
      const notes = document.getElementById("addressNotes").value.trim();
      const isDefault = document.getElementById("addressDefault").checked;
      if (!label || !street || !city || !zip) {
        addressStatus.className =
          "p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded";
        addressStatus.textContent = "Label, street, city, and zip are required";
        addressStatus.classList.remove("hidden");
        return;
      }

      const nextAddress = {
        _id: profileState.editingAddressId || `addr_${Date.now()}`,
        label,
        street,
        city,
        zip,
        notes,
        isDefault,
      };

      const others = profileState.addresses
        .filter((addr) => addr._id !== nextAddress._id)
        .map((addr) => ({
          ...addr,
          isDefault: isDefault ? false : addr.isDefault,
        }));
      profileState.addresses = normalizeAddresses([...others, nextAddress]);
      if (isDefault && profileState.addresses.length) {
        // If user explicitly checked default, mark only that address as default
        profileState.addresses = profileState.addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === nextAddress._id,
        }));
      }
      // Do not auto-assign a default address when user didn't check it.

      try {
        await persistProfile(addressStatus);
        renderAddresses();
        closeAddressForm();
      } catch (e) {
        addressStatus.className =
          "p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded";
        addressStatus.textContent = e.message;
        addressStatus.classList.remove("hidden");
      }
    });

  renderAddresses();

  // Change Password accordion toggle
  const changePwdToggle = document.getElementById("changePwdToggle");
  const changePwdBody = document.getElementById("changePwdBody");
  const changePwdChevron = document.getElementById("changePwdChevron");
  if (changePwdToggle && changePwdBody) {
    changePwdToggle.addEventListener("click", () => {
      const expanded = changePwdToggle.getAttribute("aria-expanded") === "true";
      changePwdToggle.setAttribute("aria-expanded", String(!expanded));
      changePwdBody.classList.toggle("hidden", expanded);
      if (changePwdChevron) {
        changePwdChevron.style.transform = expanded ? "" : "rotate(180deg)";
      }
    });
  }

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.title = showing ? "Show password" : "Hide password";
      button.setAttribute("aria-label", button.title);
      button.innerHTML = `<i class="bi ${showing ? "bi-eye" : "bi-eye-slash"} text-lg" aria-hidden="true"></i>`;
    });
  });

  if (addressesList)
    addressesList.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const card = btn.closest("[data-address-id]");
      if (!card) return;
      const id = card.dataset.addressId;
      const action = btn.dataset.action;
      const addr = profileState.addresses.find((a) => a._id === id);
      if (!addr) return;

      if (action === "edit") {
        openAddressForm(addr);
        return;
      }
      if (action === "default") {
        const shouldBeDefault = !addr.isDefault;
        profileState.addresses = profileState.addresses.map((a) => ({
          ...a,
          isDefault: shouldBeDefault && a._id === id,
        }));
        await persistProfile(addressStatus);
        renderAddresses();
        return;
      }
      if (action === "delete") {
        const confirmed = await showModal({
          title: "Delete Address",
          message: "Delete this saved address?",
          type: "warning",
          okText: "Delete",
          cancelText: "Cancel",
        });
        if (!confirmed) return;
        profileState.addresses = profileState.addresses.filter(
          (a) => a._id !== id,
        );
        // Do not auto-assign a default address after deletion; preserve explicit flags only.
        await persistProfile(addressStatus);
        renderAddresses();
      }
    });

  // Wire password change
  document
    .getElementById("changePasswordBtn")
    .addEventListener("click", async () => {
      const current = document.getElementById("currentPwd").value;
      const newPwd = document.getElementById("newPwd").value;
      const confirm = document.getElementById("confirmPwd").value;

      if (!current || !newPwd || !confirm) {
        showToast("Please fill in all password fields", "warning");
        return;
      }

      if (newPwd !== confirm) {
        showToast("New passwords do not match", "error");
        return;
      }

      if (newPwd.length < 6) {
        showToast("New password must be at least 6 characters", "error");
        return;
      }

      try {
        const res = await fetch("/api/users/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            oldPassword: current,
            newPassword: newPwd,
          }),
        });

        if (res.ok) {
          showToast("Password changed successfully");
          document.getElementById("currentPwd").value = "";
          document.getElementById("newPwd").value = "";
          document.getElementById("confirmPwd").value = "";
        } else {
          const err = await res.json();
          showToast(err.error || "Password change failed", "error");
        }
      } catch (e) {
        showToast("Error: " + e.message, "error");
      }
    });

  // --- Previous Orders ---
  loadUserOrders();

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

  document.getElementById("logout").addEventListener("click", async () => {
    const confirmed = await showModal({
      title: "Logout",
      message: "Are you sure you want to logout?",
      type: "warning",
      okText: "Yes, logout",
      cancelText: "Cancel",
    });
    if (confirmed) {
      clearSession();
      window.location.href = "/main.html";
    }
  });

  document
    .getElementById("deleteAccount")
    .addEventListener("click", async () => {
      const confirmed = await showModal({
        title: "Delete Account",
        message:
          "Are you sure you want to delete your account? This action cannot be undone. All your data including orders and cart will be permanently deleted.",
        type: "error",
        okText: "Yes, delete",
        cancelText: "Cancel",
      });
      if (!confirmed) return;

      try {
        const res = await fetch("/api/users/me", {
          method: "DELETE",
          headers: { Authorization: "Bearer " + getToken() },
        });

        if (res.ok) {
          await showModal({
            title: "Success",
            message: "Your account has been deleted successfully.",
            type: "success",
            okText: "OK",
            cancelText: "Close",
          });
          clearSession();
          window.location.href = "/main.html";
        } else {
          const err = await res.json();
          await showModal({
            title: "Error",
            message: err.error || "Failed to delete account",
            type: "error",
            okText: "OK",
            cancelText: "Close",
          });
        }
      } catch (e) {
        await showModal({
          title: "Error",
          message: "Error: " + e.message,
          type: "error",
          okText: "OK",
          cancelText: "Close",
        });
      }
    });
}

// --- Load and render user orders ---
async function loadUserOrders() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  const token = getToken();
  if (!token) {
    container.innerHTML =
      '<p class="text-gray-500 text-center py-6">Please log in to see your orders.</p>';
    return;
  }
  try {
    const res = await fetch("/api/orders/my", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("Failed to load orders");
    const data = await res.json();
    renderOrders(data.orders || []);
  } catch (err) {
    container.innerHTML =
      '<p class="text-red-500 text-center py-6">Could not load orders.</p>';
  }
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");
  if (!orders.length) {
    container.innerHTML =
      '<p class="text-gray-500 text-center py-8">No orders yet. Start shopping!</p>';
    return;
  }
  container.innerHTML = orders
    .map((order, idx) => {
      const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const itemRows = order.items
        .slice(0, 3)
        .map(
          (item) =>
            `<div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                <img src="/api/products/${item.productId}/image" alt="${escapeHtml(item.productName)}" class="w-full h-full object-cover" onerror="this.src='/assets/images/smoothie-bowl.jpg'">
              </div>
              <span class="text-xs text-gray-700 truncate">${escapeHtml(item.productName)}</span>
            </div>`,
        )
        .join("");
      const moreCount =
        order.items.length > 3
          ? `<p class="text-[10px] text-gray-400 mt-1">+${order.items.length - 3} more item${order.items.length - 3 > 1 ? "s" : ""}</p>`
          : "";
      const statusColor =
        order.orderStatus === "confirmed"
          ? "bg-green-100 text-green-700"
          : order.orderStatus === "delivered"
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-700";
      return `
            <div class="order-card rounded-xl border border-gray-200 ${idx > 0 ? "mt-3" : ""}" data-order-index="${idx}">
              <div class="order-header flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-gray-50 transition rounded-xl">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-gray-900 text-sm">#${escapeHtml(order.orderId)}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}">${order.orderStatus || "pending"}</span>
                  <span class="text-xs text-gray-400">${date}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="font-bold text-gray-900">₹${order.totalAmount || 0}</span>
                  <i class="bi bi-chevron-down text-gray-400 transition-transform order-chevron"></i>
                </div>
              </div>
              <div class="order-body hidden border-t border-gray-100">
                <div class="p-4 flex flex-col gap-1.5">
                  ${itemRows}${moreCount}
                </div>
                <div class="px-4 pb-3">
                  <button class="order-detail-btn text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
                    <i class="bi bi-receipt text-sm"></i> View full details
                  </button>
                </div>
              </div>
            </div>
          `;
    })
    .join("");

  // Accordion toggle
  container.querySelectorAll(".order-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      const card = header.closest(".order-card");
      const body = card.querySelector(".order-body");
      const chevron = header.querySelector(".order-chevron");
      const isOpen = !body.classList.contains("hidden");
      // Close all others
      container
        .querySelectorAll(".order-body")
        .forEach((b) => b.classList.add("hidden"));
      container
        .querySelectorAll(".order-chevron")
        .forEach((c) => c.classList.remove("rotate-180"));
      if (!isOpen) {
        body.classList.remove("hidden");
        chevron.classList.add("rotate-180");
      }
    });
  });

  // Detail button opens modal
  container.querySelectorAll(".order-detail-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = btn.closest(".order-card");
      const idx = parseInt(card.dataset.orderIndex, 10);
      openOrderDetail(orders[idx]);
    });
  });
}

function openOrderDetail(order) {
  const modal = document.getElementById("orderDetailModal");
  const title = document.getElementById("orderDetailTitle");
  const dateEl = document.getElementById("orderDetailDate");
  const content = document.getElementById("orderDetailContent");

  title.textContent = "Order #" + order.orderId;
  dateEl.textContent = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const addr = order.addressSnapshot || {};
  const addrText = [addr.street, addr.city, addr.zip]
    .filter(Boolean)
    .join(", ");

  content.innerHTML = `
          <div class="space-y-5">
            <!-- Status -->
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold ${order.orderStatus === "confirmed" ? "bg-green-100 text-green-700" : order.orderStatus === "delivered" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}">${order.orderStatus || "pending"}</span>
              <span class="px-3 py-1 rounded-full text-xs font-bold ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}">${order.paymentStatus || "unpaid"}</span>
            </div>

            <!-- Items -->
            <div>
              <h4 class="text-sm font-bold text-gray-700 mb-3">Items</h4>
              <div class="space-y-2">
                ${order.items
                  .map(
                    (item) => `
                  <div class="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div class="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src="/api/products/${item.productId}/image" alt="${escapeHtml(item.productName)}" class="w-full h-full object-cover" onerror="this.src='/assets/images/smoothie-bowl.jpg'">
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-gray-900 truncate">${escapeHtml(item.productName)}</p>
                      <p class="text-xs text-gray-500">Qty: ${item.quantity} × ₹${item.unitPrice}</p>
                    </div>
                    <span class="text-sm font-bold text-gray-900 shrink-0">₹${item.subtotal}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>

            <!-- Billing Summary -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-bold text-gray-700 mb-3">Billing Summary</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">Subtotal</span><span class="font-semibold">₹${order.subtotal || 0}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Tax</span><span class="font-semibold">₹${order.tax || 0}</span></div>
                <div class="flex justify-between"><span class="text-gray-600">Delivery Fee</span><span class="font-semibold">₹${order.deliveryFee || 0}</span></div>
                <div class="flex justify-between border-t border-gray-200 pt-2 text-base"><span class="font-bold text-gray-900">Total</span><span class="font-bold text-primary">₹${order.totalAmount || 0}</span></div>
              </div>
            </div>

            <!-- Payment Info -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-bold text-gray-700 mb-3">Payment</h4>
              <div class="text-sm space-y-1">
                <p><span class="text-gray-500">Method:</span> <span class="font-medium">${escapeHtml(order.paymentMethod || "N/A")}</span></p>
                <p><span class="text-gray-500">Mode:</span> <span class="font-medium">${order.paymentMode || "online"}</span></p>
                ${order.paymentId ? `<p><span class="text-gray-500">Payment ID:</span> <span class="font-mono text-xs">${escapeHtml(order.paymentId)}</span></p>` : ""}
              </div>
            </div>

            <!-- Delivery Address -->
            ${
              addrText
                ? `
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-bold text-gray-700 mb-2">Delivery Address</h4>
              <p class="text-sm text-gray-600">${escapeHtml(addrText)}</p>
              ${addr.notes ? `<p class="text-xs text-gray-400 mt-1">Note: ${escapeHtml(addr.notes)}</p>` : ""}
            </div>`
                : ""
            }
          </div>
        `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeOrderDetail() {
  const modal = document.getElementById("orderDetailModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Order detail modal close handlers
document.addEventListener("click", (e) => {
  if (e.target.id === "orderDetailModal") closeOrderDetail();
  if (e.target.closest("#closeOrderDetail")) closeOrderDetail();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeOrderDetail();
});

refreshLucideIcons();
showProfile();
