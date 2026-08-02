// --- Block 1 ---
/* Utilities */
      // Shared session so checkout uses the same identity as the cart page.
      const session = window.GoSmoothieSession;
      const clientIdKey = session.CLIENT_KEY;
      function getClientId() {
        return session.getClientId();
      }

      /* Load cart summary */
      let summaryItems = [];

      function selectedDeliveryPricing() {
        if (orderMode === "pickup") return { label: "Pickup", fee: 0 };
        const option =
          document.querySelector('input[name="delivery-option"]:checked')
            ?.value || "standard";
        if (option === "express") return { label: "Express delivery", fee: 20 };
        if (option === "scheduled")
          return { label: "Scheduled delivery", fee: 0 };
        return { label: "Standard delivery", fee: 0 };
      }

      // Single source for the amounts, shared by the summary panel and the
      // payment modal so both always show the same total.
      function currentOrderTotals() {
        const subtotal = summaryItems.reduce(
          (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
          0,
        );
        const tax = Math.round(subtotal * 0.1);
        const delivery = selectedDeliveryPricing();
        return {
          itemCount: summaryItems.reduce(
            (sum, item) => sum + (item.quantity || 1),
            0,
          ),
          subtotal,
          tax,
          delivery,
          finalTotal: subtotal + tax + delivery.fee,
        };
      }

      function renderOrderSummary() {
        const summary = document.getElementById("summary");
        const totalAmount = document.getElementById("totalAmount");
        const snapshot = document.getElementById("snapshotTotal");
        if (!summaryItems.length) {
          summary.innerHTML = '<p class="text-gray-600">Your cart is empty</p>';
          totalAmount.textContent = "₹ 0";
          if (snapshot) snapshot.textContent = "₹ 0";
          return;
        }

        let html = "";
        summaryItems.forEach((item) => {
          const lineTotal = (item.price || 0) * (item.quantity || 1);
          html += `<div class="flex justify-between gap-3"><span>${item.name} x${item.quantity}</span><span>₹ ${lineTotal}</span></div>`;
        });
        const { subtotal, tax, delivery, finalTotal } = currentOrderTotals();
        html += `<div class="border-t border-gray-200 my-3 pt-3">
      <div class="flex justify-between text-gray-700 mb-2"><span>Subtotal</span><span>₹ ${subtotal}</span></div>
      <div class="flex justify-between text-gray-700 mb-2"><span>Tax (10%)</span><span>₹ ${tax}</span></div>
      <div class="flex justify-between text-gray-700 mb-2"><span>${delivery.label}</span><span class="${delivery.fee ? "text-orange-600 font-semibold" : "text-green-600"}">${delivery.fee ? `₹ ${delivery.fee}` : "Free"}</span></div>
    </div>`;
        summary.innerHTML = html;
        totalAmount.textContent = "₹ " + finalTotal;
        if (snapshot) snapshot.textContent = "₹ " + finalTotal;
      }

      async function loadSummary() {
        const token = localStorage.getItem("gs_token");
        let url = "/api/cart";
        if (!token) url += "?clientId=" + getClientId();
        try {
          const r = await fetch(url, {
            headers: token ? { Authorization: "Bearer " + token } : {},
          });
          // A rejected session is handled by session.js; anything else that is
          // not a success must not be treated as an empty cart.
          if (!r.ok) return;
          const data = await r.json();
          summaryItems = Array.isArray(data.items) ? data.items : [];
          renderOrderSummary();
          return;
          if (!data.items || !data.items.length) {
            document.getElementById("summary").innerHTML =
              '<p class="text-gray-600">Your cart is empty</p>';
            document.getElementById("totalAmount").textContent = "₹ 0";
            const snapshot = document.getElementById("snapshotTotal");
            if (snapshot) snapshot.textContent = "₹ 0";
            return;
          }
          let total = 0;
          let html = "";
          data.items.forEach((it) => {
            total += (it.price || 0) * (it.quantity || 1);
            html += `<div class="flex justify-between"><span>${it.name} x${it.quantity}</span><span>₹ ${(it.price || 0) * (it.quantity || 1)}</span></div>`;
          });
          const subtotal = total;
          const tax = Math.round(subtotal * 0.1);
          const finalTotal = subtotal + tax;
          html += `<div class="border-t border-gray-200 my-3 pt-3">
      <div class="flex justify-between text-gray-700 mb-2"><span>Subtotal</span><span>₹ ${subtotal}</span></div>
      <div class="flex justify-between text-gray-700 mb-2"><span>Tax (10%)</span><span>₹ ${tax}</span></div>
      <div class="flex justify-between text-gray-700 mb-2"><span>Delivery</span><span class="text-green-600">Free</span></div>
    </div>`;
          document.getElementById("summary").innerHTML = html;
          document.getElementById("totalAmount").textContent =
            "₹ " + finalTotal;
          const snapshot = document.getElementById("snapshotTotal");
          if (snapshot) snapshot.textContent = "₹ " + finalTotal;
        } catch (e) {
          document.getElementById("summary").innerHTML =
            '<p class="text-red-600">Error loading cart</p>';
        }
      }

      /* Mode switching */
      let orderMode = "delivery";
      function updateModeUI(mode = orderMode) {
        orderMode = mode === "pickup" ? "pickup" : "delivery";
        const pickupPanel = document.getElementById("pickupPanel");
        const deliveryPanel = document.getElementById("deliveryPanel");
        const deliveryToggle = document.getElementById("modeToggleDelivery");
        const pickupToggle = document.getElementById("modeTogglePickup");

        if (pickupPanel)
          pickupPanel.classList.toggle("hidden", orderMode !== "pickup");
        if (deliveryPanel)
          deliveryPanel.classList.toggle("hidden", orderMode !== "delivery");

        if (deliveryToggle) {
          const active = orderMode === "delivery";
          deliveryToggle.className = `px-4 py-3 rounded-xl text-sm font-semibold transition shadow-sm ${active ? "bg-white text-slate-900 ring-1 ring-green-200" : "bg-transparent text-slate-500 hover:text-slate-900"}`;
        }
        if (pickupToggle) {
          const active = orderMode === "pickup";
          pickupToggle.className = `px-4 py-3 rounded-xl text-sm font-semibold transition shadow-sm ${active ? "bg-white text-slate-900 ring-1 ring-green-200" : "bg-transparent text-slate-500 hover:text-slate-900"}`;
        }
        renderOrderSummary();
      }
      document
        .getElementById("modeToggleDelivery")
        ?.addEventListener("click", () => updateModeUI("delivery"));
      document
        .getElementById("modeTogglePickup")
        ?.addEventListener("click", () => updateModeUI("pickup"));

      /* Pickup locations (sample static set) */
      const sampleStores = [
        {
          id: "s1",
          title: "Gachibowli",
          zip: "500032",
          addr: "HITEC City Main Road, Hyderabad, Telangana 500032",
          distance: "1.2 km",
        },
        {
          id: "s2",
          title: "Kokapet",
          zip: "500075",
          addr: "Golden Mile Road, Kokapet, Hyderabad, Telangana 500075",
          distance: "2.6 km",
        },
        {
          id: "s3",
          title: "Kondapur",
          zip: "500084",
          addr: "Botanical Garden Road, Kondapur, Hyderabad, Telangana 500084",
          distance: "3.1 km",
        },
      ];
      function renderPickupLocations() {
        const container = document.getElementById("pickupLocations");
        container.innerHTML = "";
        sampleStores.forEach((s) => {
          const el = document.createElement("div");
          el.className =
            "border p-3 rounded cursor-pointer hover:border-primary";
          el.dataset.storeId = s.id;
          el.dataset.zip = s.zip || "";
          el.innerHTML = `<div class="flex justify-between mb-1"><span class="font-medium">${s.title}</span><span class="text-sm text-gray-500">${s.distance}</span></div><div class="text-sm text-gray-600">${s.addr}</div>`;
          el.addEventListener("click", () => {
            container
              .querySelectorAll(".selected")
              .forEach((x) =>
                x.classList.remove(
                  "selected",
                  "border-primary",
                  "bg-primary/5",
                ),
              );
            el.classList.add("selected", "border-primary", "bg-primary/5");
            // store selection -> set hidden state in memory
            selectedFulfillment = {
              type: "pickup",
              store: s,
              time: document.getElementById("pickupTime").value || "ASAP",
              date: document.getElementById("pickupDate").value || null,
            };
          });
          container.appendChild(el);
        });
      }

      function selectPickupStoreByQuery(query) {
        const container = document.getElementById("pickupLocations");
        if (!container) return null;
        const cards = Array.from(container.children);
        if (!cards.length) return null;

        const normalized = (query || "").trim().toLowerCase();
        const digits = normalized.replace(/\D/g, "");
        let matched = null;

        if (digits) {
          matched =
            cards.find((card) => (card.dataset.zip || "").includes(digits)) ||
            null;
          if (!matched) {
            const store = sampleStores.find((s) =>
              (s.zip || "").includes(digits),
            );
            if (store) {
              matched =
                cards.find((card) => card.dataset.storeId === store.id) || null;
            }
          }
        }

        if (!matched && normalized) {
          matched =
            cards.find((card) =>
              card.textContent.toLowerCase().includes(normalized),
            ) || null;
          if (!matched) {
            const store = sampleStores.find(
              (s) =>
                s.title.toLowerCase().includes(normalized) ||
                s.addr.toLowerCase().includes(normalized) ||
                s.distance.toLowerCase().includes(normalized),
            );
            if (store) {
              matched =
                cards.find((card) => card.dataset.storeId === store.id) || null;
            }
          }
        }

        if (!matched) matched = cards[0];
        matched.click();
        matched.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return matched;
      }

      function updateDeliveryOptionUI(root = document) {
        const radios = Array.from(
          root.querySelectorAll('input[name="delivery-option"]'),
        );
        const cards = Array.from(
          root.querySelectorAll(".delivery-option-card"),
        );
        const scheduleWrap = root.querySelector("#deliveryScheduleWrap");
        const selected = radios.find((r) => r.checked) || radios[0];
        const selectedValue = selected ? selected.value : "standard";

        cards.forEach((card) => {
          const isSelected = card.dataset.option === selectedValue;
          card.classList.toggle("border-primary", isSelected);
          card.classList.toggle("bg-primary/5", isSelected);
          card.classList.toggle("border-gray-200", !isSelected);
        });

        if (scheduleWrap) {
          scheduleWrap.classList.toggle(
            "hidden",
            selectedValue !== "scheduled",
          );
          const scheduleTime = root.querySelector("#deliveryScheduleTime");
          if (scheduleTime && selectedValue !== "scheduled")
            scheduleTime.value = "";
        }
      }

      document
        .querySelectorAll('input[name="delivery-option"]')
        .forEach((radio) => {
          radio.addEventListener("change", () => {
            updateDeliveryOptionUI(document);
            renderOrderSummary();
          });
        });

      updateDeliveryOptionUI(document);

      /* Geolocation helpers */
      function setMessage(text, type) {
        const msg = document.getElementById("checkoutMessage");
        if (!msg) return;
        msg.textContent = text;
        msg.className = "p-3 text-sm rounded bg-white ring-1 ring-green-100";
        if (type === "error")
          msg.className = "p-3 text-sm rounded bg-red-50 text-red-700";
        if (type === "success")
          msg.className = "p-3 text-sm rounded bg-green-50 text-green-700";
        msg.classList.remove("hidden");
      }

      async function getCurrentPosition() {
        if (!navigator.geolocation)
          throw new Error("Geolocation is not supported");
        return await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, {
            timeout: 12000,
            enableHighAccuracy: true,
          }),
        );
      }

      async function reverseGeocode(lat, lon) {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        );
        if (!r.ok) throw new Error("Reverse geocoding failed");
        return await r.json();
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
          address.city ||
            address.town ||
            address.village ||
            address.municipality,
          address.county || address.state_district,
          address.state,
          address.postcode,
          address.country,
        ]
          .filter(
            (part, index, values) => part && values.indexOf(part) === index,
          )
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

      function applyAccountDefaultsPayment() {
        const user = (() => {
          try {
            return JSON.parse(localStorage.getItem("gs_user") || "{}");
          } catch (_) {
            return {};
          }
        })();
        const fields = [
          ["pickupName", user.name],
          ["pickupPhone", user.phone],
          ["deliveryName", user.name],
          ["deliveryPhone", user.phone],
        ];
        fields.forEach(([id, value]) => {
          const input = document.getElementById(id);
          if (
            input &&
            value &&
            !input.value.trim() &&
            (id.startsWith("pickup") || !orderForSomeoneElse)
          )
            input.value = value;
        });
        updateDeliveryRecipientUI();
      }

      let orderForSomeoneElse = false;
      let deliveryAddressSource = "saved";
      const deliverySavedAddressToggle = document.getElementById(
        "deliverySavedAddressToggle",
      );
      if (deliverySavedAddressToggle) {
        deliverySavedAddressToggle.addEventListener("click", () => {
          const content = document.getElementById(
            "deliverySavedAddressContent",
          );
          const chevron = document.getElementById(
            "deliverySavedAddressChevron",
          );
          const expanded =
            deliverySavedAddressToggle.getAttribute("aria-expanded") === "true";
          deliverySavedAddressToggle.setAttribute(
            "aria-expanded",
            String(!expanded),
          );
          if (content) content.classList.toggle("hidden", expanded);
          if (chevron)
            chevron.className = `bi ${expanded ? "bi-chevron-down" : "bi-chevron-up"} text-gray-500`;
        });
      }
      let deliveryNormalValues = { name: "", phone: "" };

      function captureDeliveryNormalValues() {
        const nameInput = document.getElementById("deliveryName");
        const phoneInput = document.getElementById("deliveryPhone");
        deliveryNormalValues = {
          name: nameInput ? nameInput.value : "",
          phone: phoneInput ? phoneInput.value : "",
        };
      }

      function restoreDeliveryNormalValues() {
        const nameInput = document.getElementById("deliveryName");
        const phoneInput = document.getElementById("deliveryPhone");
        const user = (() => {
          try {
            return JSON.parse(localStorage.getItem("gs_user") || "{}");
          } catch (_) {
            return {};
          }
        })();
        if (nameInput)
          nameInput.value = deliveryNormalValues.name || user.name || "";
        if (phoneInput)
          phoneInput.value = deliveryNormalValues.phone || user.phone || "";
      }

      function updateDeliveryRecipientUI() {
        const nameLabel = document.getElementById("deliveryNameLabel");
        const phoneLabel = document.getElementById("deliveryPhoneLabel");
        const nameInput = document.getElementById("deliveryName");
        const phoneInput = document.getElementById("deliveryPhone");
        const hint = document.getElementById("deliveryAddressHint");
        const checkbox = document.getElementById("orderForSomeoneElse");

        if (checkbox) checkbox.checked = orderForSomeoneElse;
        if (nameLabel)
          nameLabel.textContent = orderForSomeoneElse
            ? "Recipient name"
            : "Name";
        if (phoneLabel)
          phoneLabel.textContent = orderForSomeoneElse
            ? "Recipient phone"
            : "Phone";
        if (nameInput)
          nameInput.placeholder = orderForSomeoneElse
            ? "Enter recipient name"
            : "Enter your name";
        if (phoneInput)
          phoneInput.placeholder = orderForSomeoneElse
            ? "Recipient phone number"
            : "Phone number";
        if (hint)
          hint.textContent = orderForSomeoneElse
            ? "Enter the recipient details, then choose a saved address below or add a new one."
            : "Pick a saved address below or type a new address manually.";
      }

      function updateDeliveryAddressSourceUI() {
        const savedSection = document.getElementById(
          "deliverySavedAddressSection",
        );
        const savedRadio = document.querySelector(
          'input[name="deliveryAddressSource"][value="saved"]',
        );
        const newRadio = document.querySelector(
          'input[name="deliveryAddressSource"][value="new"]',
        );
        const isSaved = deliveryAddressSource === "saved";

        if (savedRadio) savedRadio.checked = isSaved;
        if (newRadio) newRadio.checked = !isSaved;
        if (savedSection) savedSection.classList.toggle("hidden", !isSaved);
        renderSavedAddressCards();
      }

      function clearDeliveryAddressFields() {
        const street = document.getElementById("deliveryStreet");
        const city = document.getElementById("deliveryCity");
        const zip = document.getElementById("deliveryZip");
        if (street) street.value = "";
        if (city) city.value = "";
        if (zip) zip.value = "";
      }

      function applyCurrentSavedAddressToForm() {
        if (!savedAddresses.length) return;
        let index = savedAddresses.findIndex(
          (address) =>
            String(address._id || "") === String(selectedSavedAddressId),
        );
        if (index < 0) {
          index = savedAddresses.findIndex((address) => address.isDefault);
        }
        if (index >= 0) {
          selectedSavedAddressId = String(savedAddresses[index]._id || index);
          fillDeliveryFromSaved(index);
        }
      }

      function syncDeliveryRecipientMode() {
        const defaultIndex = savedAddresses.findIndex((a) => a.isDefault);
        if (orderForSomeoneElse) {
          deliveryAddressSource = "new";
        } else if (defaultIndex >= 0) {
          deliveryAddressSource = "saved";
          const address = savedAddresses[defaultIndex];
          if (address) {
            selectedSavedAddressId = String(address._id || defaultIndex);
            fillDeliveryFromSaved(defaultIndex);
          }
        } else {
          deliveryAddressSource = "saved";
          clearDeliveryAddressFields();
        }
        updateDeliveryRecipientUI();
        updateDeliveryAddressSourceUI();
        if (deliveryAddressSource === "saved" && defaultIndex >= 0)
          applyCurrentSavedAddressToForm();
      }

      /* Use my location for delivery */
      async function attemptDeliveryGeolocation() {
        const status = document.getElementById("geoStatus");
        const button = document.getElementById("useLocationBtn");
        if (button) {
          button.disabled = true;
          button.innerHTML =
            '<i class="bi bi-geo-alt"></i> Getting location...';
        }
        if (status) status.textContent = "Locating...";
        try {
          deliveryAddressSource = "new";
          selectedSavedAddressId = "";
          const savedRadio = document.querySelector(
            'input[name="deliveryAddressSource"][value="saved"]',
          );
          const newRadio = document.querySelector(
            'input[name="deliveryAddressSource"][value="new"]',
          );
          if (savedRadio) savedRadio.checked = false;
          if (newRadio) newRadio.checked = true;
          clearDeliveryAddressFields();
          renderSavedAddressCards();
          const pos = await getCurrentPosition();
          const { latitude: lat, longitude: lon } = pos.coords;
          if (status) status.textContent = "Fetching address...";
          const j = await reverseGeocode(lat, lon);
          const location = parseFullDeliveryLocation(j);
          if (!location.fullAddress)
            throw new Error("No address found for this location");
          document.getElementById("deliveryStreet").value =
            location.fullAddress;
          document.getElementById("deliveryCity").value = location.city;
          document.getElementById("deliveryZip").value = location.postcode;
          updateDeliveryAddressSourceUI();
          const accuracy = Math.round(pos.coords.accuracy || 0);
          if (status)
            status.textContent = `Complete address filled${accuracy ? ` (GPS accuracy about ${accuracy} m)` : ""}.`;
        } catch (err) {
          if (status)
            status.textContent =
              "Unable to fetch the complete address. Please enter it manually.";
          console.error(err);
        } finally {
          if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="bi bi-geo-alt"></i> Use My Location';
          }
        }
      }

      /* Use my location for pickup */
      async function attemptPickupGeolocation() {
        const status = document.getElementById("pickupGeoStatus");
        if (status) status.textContent = "Locating...";
        try {
          const pos = await getCurrentPosition();
          const { latitude: lat, longitude: lon } = pos.coords;
          if (status) status.textContent = "Finding nearest stores...";
          const j = await reverseGeocode(lat, lon);
          const addr = j.address || {};
          const hint =
            addr.postcode || addr.suburb || addr.city || addr.town || "";
          const search = document.getElementById("pickupSearch");
          if (search && hint) search.value = hint;
          renderPickupLocations();
          selectPickupStoreByQuery(hint);
          if (status) status.textContent = "Nearby stores updated";
        } catch (err) {
          if (status) status.textContent = "Unable to use location";
          console.error(err);
        }
      }

      /* Form submit and build payload */
      let selectedFulfillment = null;
      document
        .getElementById("pickupFindBtn")
        .addEventListener("click", (e) => {
          e.preventDefault();
          const query = document.getElementById("pickupSearch")
            ? document.getElementById("pickupSearch").value
            : "";
          renderPickupLocations();
          const selected = selectPickupStoreByQuery(query);
          const status = document.getElementById("pickupGeoStatus");
          if (status) {
            status.textContent = selected
              ? `Selected ${selected.querySelector(".font-medium")?.textContent || "a nearby store"}`
              : "No stores found";
          }
        });
      document
        .getElementById("useLocationBtn")
        .addEventListener("click", () => {
          attemptDeliveryGeolocation();
        });
      document
        .getElementById("pickupUseLocationBtn")
        .addEventListener("click", () => {
          attemptPickupGeolocation();
        });
      document
        .getElementById("orderForSomeoneElse")
        .addEventListener("change", (e) => {
          orderForSomeoneElse = e.target.checked;
          if (orderForSomeoneElse) {
            captureDeliveryNormalValues();
            deliveryAddressSource = "new";
          } else {
            restoreDeliveryNormalValues();
            deliveryAddressSource =
              savedAddresses.findIndex((a) => a.isDefault) >= 0
                ? "saved"
                : "new";
          }
          syncDeliveryRecipientMode();
        });
      document
        .querySelectorAll('input[name="deliveryAddressSource"]')
        .forEach((radio) => {
          radio.addEventListener("change", (e) => {
            deliveryAddressSource = e.target.value === "new" ? "new" : "saved";
            if (deliveryAddressSource === "saved") {
              applyCurrentSavedAddressToForm();
            } else {
              clearDeliveryAddressFields();
            }
            updateDeliveryAddressSourceUI();
            if (deliveryAddressSource === "new") {
              const street = document.getElementById("deliveryStreet");
              if (street && !street.value.trim()) street.focus();
            }
          });
        });

      let orderSubmissionInProgress = false;

      /*
       * Checkout runs in two steps now: collectOrderRequest() validates the
       * form and builds the request, the payment modal collects the payment
       * choice, and submitOrder() sends it. That way the modal can only open
       * for an order that is actually ready to be placed.
       */
      function collectOrderRequest() {
        const msg = document.getElementById("checkoutMessage");
        if (msg) msg.classList.add("hidden");
        const mode = orderMode;
        let name = "";
        let phone = "";
        if (mode === "pickup") {
          name =
            (document.getElementById("pickupName") &&
              document.getElementById("pickupName").value.trim()) ||
            "";
          phone =
            (document.getElementById("pickupPhone") &&
              document.getElementById("pickupPhone").value.trim()) ||
            "";
        } else {
          name =
            (document.getElementById("deliveryName") &&
              document.getElementById("deliveryName").value.trim()) ||
            "";
          phone =
            (document.getElementById("deliveryPhone") &&
              document.getElementById("deliveryPhone").value.trim()) ||
            "";
        }
        if (!name || !phone) {
          setMessage("Name and phone are required", "error");
          return;
        }

        const customer = { name, phone, forSomeoneElse: orderForSomeoneElse };
        const body = {
          customer,
          mode,
          clientId: getClientId(),
          orderForSomeoneElse,
        };

        if (mode === "pickup") {
          if (!selectedFulfillment || selectedFulfillment.type !== "pickup") {
            setMessage("Please select a pickup location", "error");
            return;
          }
          body.fulfillment = selectedFulfillment;
        } else {
          const street = document.getElementById("deliveryStreet").value.trim();
          const city = document.getElementById("deliveryCity").value.trim();
          const zip = document.getElementById("deliveryZip").value.trim();
          if (!street || !city) {
            setMessage("Delivery street and city required", "error");
            return;
          }
          const deliveryOption =
            document.querySelector('input[name="delivery-option"]:checked')
              ?.value || "standard";
          const scheduledTime = document.getElementById("deliveryScheduleTime")
            ? document.getElementById("deliveryScheduleTime").value
            : "";
          if (deliveryOption === "scheduled" && !scheduledTime) {
            setMessage("Please choose a scheduled time", "error");
            return;
          }
          const notes = document.getElementById("deliveryNotes").value.trim();
          body.fulfillment = {
            type: "delivery",
            address: { street, city, zip },
            notes,
            deliveryOption,
            scheduledTime,
            savedAddressId:
              deliveryAddressSource === "saved"
                ? selectedSavedAddressId || null
                : null,
            addressSource: deliveryAddressSource,
          };
        }

        return { body, mode };
      }

      async function submitOrder(body, mode) {
        if (orderSubmissionInProgress) return;
        const token = localStorage.getItem("gs_token");
        const submitButtons = [
          document.getElementById("pickupContinueBtn"),
          document.getElementById("deliveryContinueBtn"),
        ].filter(Boolean);
        orderSubmissionInProgress = true;
        submitButtons.forEach((button) => {
          button.disabled = true;
          button.classList.add("opacity-60", "cursor-not-allowed");
        });
        const activeButton =
          mode === "pickup"
            ? document.getElementById("pickupContinueBtn")
            : document.getElementById("deliveryContinueBtn");
        const originalButtonText = activeButton ? activeButton.textContent : "";
        if (activeButton) activeButton.textContent = "Placing Order...";

        try {
          const headers = Object.assign(
            { "Content-Type": "application/json" },
            token ? { Authorization: "Bearer " + token } : {},
          );

          /*
           * External payment processing is intentionally disabled for now.
           * Restore this block when online payments are enabled:
           *
           * const paymentResponse = await fetch("/api/payments/create-session", {
           *   method: "POST",
           *   headers,
           *   body: JSON.stringify({
           *     clientId: body.clientId,
           *     successUrl: window.location.origin + "/order-confirmation.html",
           *     cancelUrl: window.location.href,
           *   }),
           * });
           * const paymentSession = await paymentResponse.json();
           * if (paymentSession.url) {
           *   window.location.assign(paymentSession.url);
           *   return;
           * }
           */

          const res = await fetch("/api/orders", {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(12000),
          });
          const data = await res.json();
          if (res.ok && data.orderId) {
            setMessage("Order placed! Redirecting...", "success");
            localStorage.removeItem(clientIdKey);
            window.location.assign(
              "/order-confirmation.html?orderId=" +
                encodeURIComponent(data.orderId),
            );
            return;
          } else {
            setMessage(data.error || "Order failed", "error");
          }
        } catch (err) {
          setMessage(
            err.name === "TimeoutError"
              ? "Order request timed out. Please try again."
              : "Could not place the order. Please try again.",
            "error",
          );
        } finally {
          orderSubmissionInProgress = false;
          submitButtons.forEach((button) => {
            button.disabled = false;
            button.classList.remove("opacity-60", "cursor-not-allowed");
          });
          if (activeButton) activeButton.textContent = originalButtonText;
        }
      }

      /*
       * "Place Order & Pay" now opens the payment options modal. The order is
       * only submitted once a payment method has been chosen there.
       */
      async function startCheckout() {
        if (orderSubmissionInProgress) return;
        const request = collectOrderRequest();
        if (!request) return;
        if (window.GoSmoothiePayModal) {
          window.GoSmoothiePayModal.open(request);
          return;
        }
        // Without the modal (script blocked), keep the original direct flow.
        await submitOrder(request.body, request.mode);
      }

      // The payment modal calls back here once a method has been selected.
      window.GoSmoothieCheckout = {
        submitOrder,
        currentOrderTotals,
        setMessage,
        getOrderMode: () => orderMode,
      };

      document
        .getElementById("pickupContinueBtn")
        .addEventListener("click", startCheckout);
      document
        .getElementById("deliveryContinueBtn")
        .addEventListener("click", startCheckout);

      /* Init */
      updateModeUI(orderMode);
      renderPickupLocations();
      loadSummary();
      applyAccountDefaultsPayment();
      // Load saved addresses for logged-in users
      let savedAddresses = [];
      let selectedSavedAddressId = "";
      async function loadSavedAddresses() {
        const token = localStorage.getItem("gs_token");
        if (!token) {
          savedAddresses = [];
          selectedSavedAddressId = "";
          syncDeliveryRecipientMode();
          return;
        }
        try {
          const r = await fetch("/api/users/me", {
            headers: { Authorization: "Bearer " + token },
          });
          if (!r.ok) {
            savedAddresses = [];
            selectedSavedAddressId = "";
            syncDeliveryRecipientMode();
            return;
          }
          const data = await r.json();
          savedAddresses = Array.isArray(data.addresses) ? data.addresses : [];
          const defaultIndex = savedAddresses.findIndex((a) => a.isDefault);
          if (defaultIndex >= 0) {
            selectedSavedAddressId = String(
              savedAddresses[defaultIndex]._id || defaultIndex,
            );
            fillDeliveryFromSaved(defaultIndex);
          } else {
            selectedSavedAddressId = "";
            clearDeliveryAddressFields();
          }
          syncDeliveryRecipientMode();
        } catch (e) {
          console.error("loadSavedAddresses", e);
        }
      }
      function renderSavedAddressCards() {
        const container = document.getElementById("deliverySavedAddressCards");
        const badge = document.getElementById("deliverySavedAddressBadge");
        const section = document.getElementById("deliverySavedAddressSection");
        if (!container) return;
        if (!savedAddresses.length) {
          container.innerHTML =
            '<div class="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500">No saved addresses yet. Add one in your profile.</div>';
          if (badge) {
            badge.textContent = "";
            badge.classList.add("hidden");
          }
          if (section)
            section.classList.toggle(
              "hidden",
              deliveryAddressSource !== "saved",
            );
          return;
        }

        if (section)
          section.classList.toggle("hidden", deliveryAddressSource !== "saved");
        container.innerHTML = "";
        savedAddresses.forEach((address, idx) => {
          const selected =
            String(address._id || idx) === String(selectedSavedAddressId);
          const isDefault = !!address.isDefault;
          const card = document.createElement("button");
          card.type = "button";
          card.className = `flex-1 min-w-[200px] text-left rounded-xl border-2 p-3 transition ${selected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary"}`;
          card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-semibold text-gray-900">${address.label || "Address"}</span>
            ${isDefault ? '<span class="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded border border-purple-300 bg-purple-50 text-purple-600"><i class="bi bi-house-gear text-sm"></i></span>' : ""}
          </div>
          <p class="text-sm text-gray-700">${address.street || ""}</p>
          <p class="text-sm text-gray-500">${address.city || ""} ${address.zip || ""}</p>
        </div>
        ${selected ? '<i class="bi bi-patch-check-fill text-green-500 text-xl shrink-0"></i>' : ""}
      </div>
    `;
          card.addEventListener("click", () => selectSavedAddress(idx));
          container.appendChild(card);
        });

        if (badge) {
          const activeIndex = savedAddresses.findIndex(
            (a) => String(a._id || "") === String(selectedSavedAddressId),
          );
          if (activeIndex >= 0) {
            badge.textContent = `Selected saved address: ${savedAddresses[activeIndex].label || "Saved address"}`;
            badge.classList.remove("hidden");
          } else {
            badge.textContent = "";
            badge.classList.add("hidden");
          }
        }
      }
      function selectSavedAddress(idx) {
        const address = savedAddresses[idx];
        if (!address) return;
        const addressId = String(address._id || idx);
        if (String(selectedSavedAddressId) === addressId) {
          clearSelectedSavedAddress();
          return;
        }
        selectedSavedAddressId = addressId;
        deliveryAddressSource = "saved";
        fillDeliveryFromSaved(idx);
        updateDeliveryAddressSourceUI();
        renderSavedAddressCards();
      }
      function clearSelectedSavedAddress() {
        selectedSavedAddressId = "";
        deliveryAddressSource = "saved";
        clearDeliveryAddressFields();
        const savedRadio = document.querySelector(
          'input[name="deliveryAddressSource"][value="saved"]',
        );
        const newRadio = document.querySelector(
          'input[name="deliveryAddressSource"][value="new"]',
        );
        if (savedRadio) savedRadio.checked = true;
        if (newRadio) newRadio.checked = false;
        renderSavedAddressCards();
      }
      function fillDeliveryFromSaved(idx) {
        const a = savedAddresses[idx];
        if (!a) return;
        const street = document.getElementById("deliveryStreet");
        const city = document.getElementById("deliveryCity");
        const zip = document.getElementById("deliveryZip");
        const phone = document.getElementById("deliveryPhone");
        if (street) street.value = a.street || "";
        if (city) city.value = a.city || "";
        if (zip) zip.value = a.zip || "";
        if (phone && a.phone) phone.value = a.phone;
      }
      ["deliveryStreet", "deliveryCity", "deliveryZip"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener("input", () => {
            deliveryAddressSource = "new";
            selectedSavedAddressId = "";
            const savedRadio = document.querySelector(
              'input[name="deliveryAddressSource"][value="saved"]',
            );
            const newRadio = document.querySelector(
              'input[name="deliveryAddressSource"][value="new"]',
            );
            if (savedRadio) savedRadio.checked = false;
            if (newRadio) newRadio.checked = true;
            renderSavedAddressCards();
          });
        }
      });
      loadSavedAddresses();
      updateDeliveryRecipientUI();
      updateDeliveryAddressSourceUI();

// --- Block 2 ---
/*
       * Payment options modal controller.
       *
       * The modal only collects a payment choice; the order itself is still
       * placed by window.GoSmoothieCheckout.submitOrder(). No card details or
       * UPI ids are stored or sent anywhere: only the method label travels with
       * the order (for example "Card •••• 4242"), because this build has no
       * payment gateway configured.
       */
      (function initPaymentModal() {
        const modal = document.getElementById("payModal");
        if (!modal) return;

        const checkout = () => window.GoSmoothieCheckout || {};
        const rail = document.getElementById("payMethodRail");
        const methodButtons = Array.from(
          rail.querySelectorAll("[data-method]"),
        );
        const panes = Array.from(modal.querySelectorAll("[data-pane]"));
        const amountLabels = Array.from(
          modal.querySelectorAll("[data-pay-amount]"),
        );
        const summaryTotal = document.getElementById("paySummaryTotal");
        const summaryMeta = document.getElementById("paySummaryMeta");
        const contactLabel = document.getElementById("payContactLabel");
        const contactSheet = document.getElementById("payContactSheet");
        const contactInput = document.getElementById("payContactInput");
        const contactError = document.getElementById("payContactError");
        const offersSheet = document.getElementById("payOffersSheet");
        const moreMenu = document.getElementById("payMoreMenu");
        const qrBox = document.getElementById("payQr");
        const showQrBtn = document.getElementById("payShowQrBtn");
        const codRailItem = rail.querySelector('[data-method="cod"]');
        const codNotice = document.getElementById("payCodNotice");
        const codText = {
          railTitle: modal.querySelector("[data-cod-rail-title]"),
          railNote: modal.querySelector("[data-cod-rail-note]"),
          title: modal.querySelector("[data-cod-title]"),
          lead: modal.querySelector("[data-cod-lead]"),
          amountLabel: modal.querySelector("[data-cod-amount-label]"),
          changeNote: modal.querySelector("[data-cod-note-change]"),
        };

        let pendingRequest = null;
        let activeMethod = "upi";
        let selectedBank = "";
        let selectedWallet = "";
        let offerApplied = false;
        let lastFocused = null;

        // `slug` points at payment-brands.js, which owns the artwork and the
        // lettered-chip fallback. `short`/`color` stay as a last resort for a
        // slug the registry does not know.
        const SUGGESTED_BANKS = [
          {
            slug: "sbi",
            name: "State Bank of India",
            short: "SB",
            color: "#22409a",
          },
          { slug: "hdfc", name: "HDFC Bank", short: "HD", color: "#e11d2e" },
          { slug: "icici", name: "ICICI Bank", short: "IC", color: "#f58220" },
          {
            slug: "kotak",
            name: "Kotak Mahindra Bank",
            short: "KO",
            color: "#ed1c24",
          },
          { slug: "axis", name: "Axis Bank", short: "AX", color: "#97144d" },
        ];
        const ALL_BANKS = [
          {
            slug: "airtel-payments-bank",
            name: "Airtel Payments Bank",
            short: "AI",
            color: "#e40000",
          },
          {
            slug: "indian-bank",
            name: "Indian Bank (Erstwhile Allahabad Bank)",
            short: "IN",
            color: "#1d4ed8",
          },
          {
            slug: "bank-of-baroda",
            name: "Bank of Baroda",
            short: "BB",
            color: "#f97316",
          },
          {
            slug: "canara",
            name: "Canara Bank",
            short: "CA",
            color: "#0e7490",
          },
          {
            slug: "pnb",
            name: "Punjab National Bank",
            short: "PN",
            color: "#a16207",
          },
          {
            slug: "union-bank",
            name: "Union Bank of India",
            short: "UN",
            color: "#b91c1c",
          },
          {
            slug: "idfc-first",
            name: "IDFC FIRST Bank",
            short: "ID",
            color: "#7c3aed",
          },
          { slug: "yes-bank", name: "Yes Bank", short: "YE", color: "#1e3a8a" },
          {
            slug: "indusind",
            name: "IndusInd Bank",
            short: "IU",
            color: "#be123c",
          },
          {
            slug: "federal-bank",
            name: "Federal Bank",
            short: "FE",
            color: "#047857",
          },
        ];
        const WALLETS = [
          {
            slug: "amazon-pay",
            name: "Amazon Pay",
            short: "az",
            color: "#232f3e",
          },
          { slug: "phonepe", name: "PhonePe", short: "Pp", color: "#5f259f" },
          { slug: "mobikwik", name: "Mobikwik", short: "Mw", color: "#2563eb" },
          {
            slug: "airtel-payments-bank",
            name: "Airtel Payments Bank",
            short: "Ai",
            color: "#e40000",
          },
          {
            slug: "ola-money",
            name: "Ola Money (Postpaid + Wallet)",
            short: "Ol",
            color: "#166534",
          },
        ];

        /* ---------- brand marks ---------- */
        const brands = () => window.GoSmoothieBrands || null;

        // One mark, or the row's own lettered chip if the registry is missing.
        function brandMark(entry, options) {
          const registry = brands();
          if (registry) return registry.mark(entry.slug, options);
          const naming = (options || {}).decorative
            ? ' aria-hidden="true"'
            : ` role="img" aria-label="${entry.name}"`;
          return `<span class="pay-chip shrink-0" style="background:${entry.color}" data-brand="${entry.slug}"${naming}>${entry.short}</span>`;
        }

        /**
         * The method rail and the UPI QR strip are static markup, so their marks
         * are filled once from the registry here rather than hard-coded in HTML.
         * That keeps a single source for artwork, sizes and fallbacks, and means
         * a brand losing its file needs no HTML edit.
         */
        function renderStaticMarks() {
          const registry = brands();
          if (!registry) return;
          modal.querySelectorAll("[data-brand-marks]").forEach((holder) => {
            const size = holder.dataset.brandSize || "sm";
            holder.innerHTML = holder.dataset.brandMarks
              .split(",")
              .map((slug) => slug.trim())
              .filter(Boolean)
              // Rail and QR-strip marks name their brand: nothing beside them
              // repeats it.
              .map((slug) => registry.mark(slug, { size, decorative: false }))
              .join("");
          });
        }

        /**
         * A logo that fails to load is replaced by that brand's lettered chip.
         * `error` does not bubble, so this has to listen in the capture phase,
         * which also covers rows rendered after load.
         */
        function handleBrandImageError(event) {
          const img = event.target;
          if (
            !img ||
            img.tagName !== "IMG" ||
            !img.classList.contains("pay-logo")
          )
            return;
          const registry = brands();
          const slug = img.dataset.brand || "";
          const box = img.closest(".pay-logo-box") || img;
          const decorative = img.getAttribute("aria-hidden") === "true";
          const chip = registry
            ? registry.chip(slug, { decorative })
            : `<span class="pay-chip shrink-0" data-brand="${slug}" style="background:#334155"${decorative ? ' aria-hidden="true"' : ""}>?</span>`;
          box.outerHTML = chip;
        }

        const rupees = (value) =>
          "₹" + Number(value || 0).toLocaleString("en-IN");

        /* ---------- cash on delivery configuration ---------- */
        /*
         * Cash availability and its limit live on the server
         * (GET /api/payments/options, backed by server/config/payments.js).
         * These defaults mirror the server's own defaults so a failed, slow or
         * malformed config read never blocks checkout; the server enforces the
         * real rule when the order is placed either way.
         */
        const COD_FALLBACK = Object.freeze({
          enabled: true,
          maxOrderTotal: 2000,
          currency: "INR",
        });
        let codOptions = COD_FALLBACK;

        // Each field is validated on its own, so one bad value does not throw
        // away a good one.
        function normaliseCodOptions(payload) {
          const cod = (payload && payload.cod) || {};
          const limit = cod.maxOrderTotal;
          return {
            enabled:
              typeof cod.enabled === "boolean"
                ? cod.enabled
                : COD_FALLBACK.enabled,
            maxOrderTotal:
              typeof limit === "number" && Number.isFinite(limit) && limit > 0
                ? limit
                : COD_FALLBACK.maxOrderTotal,
            currency:
              typeof cod.currency === "string" && cod.currency.trim()
                ? cod.currency.trim()
                : COD_FALLBACK.currency,
          };
        }

        // The cached configuration, for eligibility and pane wording.
        function codConfig() {
          return codOptions;
        }

        /*
         * Fetched once on page load rather than on every modal open: these are
         * configuration values, not order state, and re-reading them per open
         * would add a request to a path the shopper takes repeatedly.
         * Every failure mode (non-ok response, network error, unparseable body)
         * silently keeps the fallback.
         */
        async function loadCodOptions() {
          try {
            const response = await fetch("/api/payments/options", {
              headers: { Accept: "application/json" },
            });
            if (!response || !response.ok) return;
            codOptions = normaliseCodOptions(await response.json());
          } catch (error) {
            /* keep COD_FALLBACK: a config read must never break checkout */
          }
        }

        /* ---------- cash on delivery wording and eligibility ---------- */
        /*
         * One pane serves both order modes, so every string that reads wrongly
         * for a pickup lives here rather than in the markup. The markup ships
         * the delivery wording, which is what a shopper sees before the mode is
         * known.
         */
        const COD_WORDING = {
          delivery: {
            railTitle: "Cash on Delivery",
            railNote: "Pay when it arrives",
            title: "Cash on Delivery",
            lead: "Hand the cash to our delivery partner.",
            amountLabel: "Payable on delivery",
            changeNote: "Keep exact change handy so the handover is quick.",
            noun: "Cash on Delivery",
            // The label stored on the order. Deliberately not the pane heading:
            // staff read this in the dashboard, so it names the arrangement.
            orderLabel: "Cash on Delivery",
          },
          pickup: {
            railTitle: "Pay at counter",
            railNote: "Pay when you collect",
            title: "Pay at counter",
            lead: "Pay in cash when you collect your order.",
            amountLabel: "Payable at the counter",
            changeNote: "Keep exact change handy so the pickup is quick.",
            noun: "Paying at the counter",
            orderLabel: "Cash at Counter",
          },
        };

        function codWording() {
          const mode = checkout().getOrderMode
            ? checkout().getOrderMode()
            : "delivery";
          return COD_WORDING[mode === "pickup" ? "pickup" : "delivery"];
        }

        /*
         * Read the configuration at the moment eligibility is computed, never
         * once at startup: the options fetch can resolve after the first read.
         * The reason is shopper-facing and names the limit, so an ineligible
         * shopper knows what to do instead of meeting a dead confirm button.
         */
        function codEligibility() {
          const config = codConfig();
          const words = codWording();
          if (!config.enabled) {
            return {
              eligible: false,
              reason: `${words.noun} is not available right now. Please choose an online payment method.`,
            };
          }
          const totals = checkout().currentOrderTotals
            ? checkout().currentOrderTotals()
            : { finalTotal: 0 };
          const total = Number(totals.finalTotal) || 0;
          if (total > config.maxOrderTotal) {
            return {
              eligible: false,
              reason: `${words.noun} is available on orders up to ${rupees(config.maxOrderTotal)}. Please choose an online method for this order.`,
            };
          }
          return { eligible: true, reason: "" };
        }

        // Muting is two utilities plus aria-disabled; both are removed again the
        // moment the order becomes eligible, so nothing sticks between opens.
        const COD_MUTED_CLASSES = ["opacity-50", "cursor-not-allowed"];

        /**
         * Applies the mode wording and the eligibility state to the rail item,
         * the pane and the confirm button. Called on open and whenever the
         * delivery option changes behind the modal.
         */
        function refreshCodState() {
          const words = codWording();
          Object.keys(codText).forEach((key) => {
            if (codText[key]) codText[key].textContent = words[key];
          });

          const { eligible, reason } = codEligibility();
          if (codRailItem) {
            if (eligible) {
              codRailItem.removeAttribute("aria-disabled");
              codRailItem.classList.remove(...COD_MUTED_CLASSES);
            } else {
              codRailItem.setAttribute("aria-disabled", "true");
              codRailItem.classList.add(...COD_MUTED_CLASSES);
            }
          }
          if (codNotice) {
            codNotice.textContent = eligible ? "" : reason;
            codNotice.classList.toggle("hidden", eligible);
          }
          const confirmButton = submitButtonFor("cod");
          if (confirmButton) confirmButton.disabled = !eligible;
          return eligible;
        }

        /* ---------- amounts ---------- */
        function refreshAmounts() {
          const totals = checkout().currentOrderTotals
            ? checkout().currentOrderTotals()
            : { finalTotal: 0, itemCount: 0 };
          const amount = totals.finalTotal || 0;
          if (summaryTotal) summaryTotal.textContent = rupees(amount);
          if (summaryMeta) {
            const items = totals.itemCount || 0;
            summaryMeta.textContent = `incl. taxes · ${items} item${items === 1 ? "" : "s"}`;
          }
          amountLabels.forEach((el) => {
            el.textContent = rupees(amount);
          });
        }

        /* ---------- QR placeholder ---------- */
        // A deterministic pattern stands in for a real gateway QR code.
        function renderQr() {
          if (!qrBox || qrBox.dataset.rendered === "1") return;
          const size = 21;
          let seed = 7;
          const next = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
          };
          let cells = "";
          for (let row = 0; row < size; row += 1) {
            for (let col = 0; col < size; col += 1) {
              const finder =
                (row < 7 && col < 7) ||
                (row < 7 && col > size - 8) ||
                (row > size - 8 && col < 7);
              const on = finder
                ? (row % 6 === 0 && col < 7) ||
                  (col % 6 === 0 && row < 7) ||
                  (row > 1 && row < 5 && col > 1 && col < 5) ||
                  (row < 7 &&
                    col > size - 8 &&
                    (row % 6 === 0 || col % 6 === 0)) ||
                  (row > size - 8 &&
                    col < 7 &&
                    (row % 6 === 0 || col % 6 === 0))
                : next() > 0.52;
              if (on) {
                cells += `<rect x="${col}" y="${row}" width="1" height="1" fill="#0f172a"></rect>`;
              }
            }
          }
          qrBox.innerHTML = `<svg viewBox="0 0 ${size} ${size}" class="h-full w-full" role="img" aria-label="UPI QR code placeholder">${cells}</svg>`;
          qrBox.dataset.rendered = "1";
        }

        /* ---------- lists ---------- */
        function bankRow(bank) {
          return `
            <button type="button" class="pay-row flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left"
                    data-bank="${bank.name}" aria-pressed="${selectedBank === bank.name}">
              ${brandMark(bank, { size: "md", decorative: true })}
              <span class="flex-1 text-sm font-medium text-slate-800">${bank.name}</span>
              <i class="bi bi-chevron-right text-slate-400 text-sm"></i>
            </button>`;
        }

        function walletRow(wallet) {
          return `
            <button type="button" class="pay-row flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left"
                    data-wallet="${wallet.name}" aria-pressed="${selectedWallet === wallet.name}">
              ${brandMark(wallet, { size: "md", decorative: true })}
              <span class="flex-1 text-sm font-medium text-slate-800">${wallet.name}</span>
              <i class="bi bi-chevron-right text-slate-400 text-sm"></i>
            </button>`;
        }

        function renderBanks(term = "") {
          const query = term.trim().toLowerCase();
          const match = (bank) => bank.name.toLowerCase().includes(query);
          const suggested = SUGGESTED_BANKS.filter(match);
          const all = ALL_BANKS.filter(match);
          document.getElementById("payBankSuggested").innerHTML = suggested
            .map(bankRow)
            .join("");
          document.getElementById("payBankAll").innerHTML = all
            .map(bankRow)
            .join("");
          document
            .getElementById("payBankSuggestedWrap")
            .classList.toggle("hidden", !suggested.length);
          document
            .getElementById("payBankAllWrap")
            .classList.toggle("hidden", !all.length);
          document
            .getElementById("payBankEmpty")
            .classList.toggle("hidden", suggested.length + all.length > 0);
        }

        function renderWallets() {
          document.getElementById("payWalletList").innerHTML =
            WALLETS.map(walletRow).join("");
        }

        function submitButtonFor(method) {
          return modal.querySelector(`[data-pay-submit="${method}"]`);
        }

        /* ---------- method switching ---------- */
        function selectMethod(method) {
          // An ineligible method keeps its rail item (so its reason stays
          // readable) but cannot become the active pane.
          const target = methodButtons.find(
            (button) => button.dataset.method === method,
          );
          if (target && target.getAttribute("aria-disabled") === "true") return;
          activeMethod = method;
          methodButtons.forEach((button) => {
            button.setAttribute(
              "aria-selected",
              button.dataset.method === method ? "true" : "false",
            );
          });
          panes.forEach((pane) => {
            const isActive = pane.dataset.pane === method;
            pane.classList.toggle("hidden", !isActive);
            if (isActive) {
              // Restart the entrance animation on every switch.
              pane.classList.remove("pay-pane");
              void pane.offsetWidth;
              pane.classList.add("pay-pane");
            }
          });
          document.getElementById("payPaneWrap").scrollTop = 0;
        }

        /* ---------- sheets ---------- */
        function openSheet(sheet) {
          closeMoreMenu();
          sheet.classList.remove("hidden");
          sheet.classList.add("flex");
          sheet.setAttribute("aria-hidden", "false");
        }
        function closeSheet(sheet) {
          sheet.classList.add("hidden");
          sheet.classList.remove("flex");
          sheet.setAttribute("aria-hidden", "true");
        }
        function closeAllSheets() {
          closeSheet(contactSheet);
          closeSheet(offersSheet);
        }
        function closeMoreMenu() {
          moreMenu.classList.add("hidden");
        }

        /* ---------- contact number ---------- */
        function activePhoneField() {
          const mode = checkout().getOrderMode
            ? checkout().getOrderMode()
            : "delivery";
          return document.getElementById(
            mode === "pickup" ? "pickupPhone" : "deliveryPhone",
          );
        }

        function refreshContactLabel() {
          const field = activePhoneField();
          const digits = String((field && field.value) || "").replace(
            /\D/g,
            "",
          );
          const local = digits.slice(-10);
          if (contactLabel) {
            contactLabel.textContent = local
              ? "+91 " + local.replace(/(\d{5})(\d{5})/, "$1 $2")
              : "+91 —";
          }
          if (contactInput) contactInput.value = local;
        }

        /* ---------- payment confirmation ---------- */
        function describeSelection() {
          if (activeMethod === "upi") {
            const upiId = document.getElementById("payUpiId").value.trim();
            return upiId ? `UPI · ${upiId}` : "UPI QR";
          }
          if (activeMethod === "card") {
            const digits = document
              .getElementById("payCardNumber")
              .value.replace(/\D/g, "");
            return `Card •••• ${digits.slice(-4)}`;
          }
          if (activeMethod === "netbanking")
            return `Netbanking · ${selectedBank}`;
          if (activeMethod === "cod") return codWording().orderLabel;
          return `Wallet · ${selectedWallet}`;
        }

        function showError(el, message) {
          if (!el) return;
          el.textContent = message;
          el.classList.toggle("hidden", !message);
        }

        function validateSelection() {
          if (activeMethod === "upi") {
            const value = document.getElementById("payUpiId").value.trim();
            // The QR path needs no id; a typed id must look like one.
            if (value && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(value)) {
              showError(
                document.getElementById("payUpiError"),
                "Enter a UPI ID like yourname@upi, or pay using the QR.",
              );
              return false;
            }
            showError(document.getElementById("payUpiError"), "");
            return true;
          }
          if (activeMethod === "card") {
            const error = document.getElementById("payCardError");
            const digits = document
              .getElementById("payCardNumber")
              .value.replace(/\D/g, "");
            const expiry = document
              .getElementById("payCardExpiry")
              .value.trim();
            const cvv = document.getElementById("payCardCvv").value.trim();
            if (digits.length < 13 || digits.length > 19) {
              showError(error, "Enter a valid card number.");
              return false;
            }
            const parts = expiry.split("/").map((part) => part.trim());
            const month = Number(parts[0]);
            const year = Number(parts[1]);
            if (
              !month ||
              month < 1 ||
              month > 12 ||
              !parts[1] ||
              parts[1].length !== 2
            ) {
              showError(error, "Enter the expiry as MM / YY.");
              return false;
            }
            const now = new Date();
            const expiryDate = new Date(2000 + year, month, 0, 23, 59, 59);
            if (expiryDate < now) {
              showError(error, "That card has expired.");
              return false;
            }
            if (!/^\d{3,4}$/.test(cvv)) {
              showError(error, "Enter the 3 or 4 digit CVV.");
              return false;
            }
            showError(error, "");
            return true;
          }
          if (activeMethod === "netbanking") return !!selectedBank;
          // Nothing is collected for cash, so eligibility is the whole check.
          // refreshCodState() re-reads the mode and total and writes the reason
          // into the notice, so a blocked confirm always explains itself.
          if (activeMethod === "cod") return refreshCodState();
          return !!selectedWallet;
        }

        async function confirmPayment() {
          if (!pendingRequest) return;
          if (!validateSelection()) return;
          const button = submitButtonFor(activeMethod);
          const originalText = button ? button.innerHTML : "";
          if (button) {
            button.disabled = true;
            button.innerHTML = "Processing...";
          }
          const paymentMethod = describeSelection();
          const isCash = activeMethod === "cod";
          // Read everything needed before close(), which resets the state.
          const mode = pendingRequest.mode;
          const body = Object.assign({}, pendingRequest.body, {
            paymentMethod,
            // The server derives paymentStatus from this, never from the label.
            paymentMode: isCash ? "cod" : "online",
            // The offer is a UPI promotion, so it never rides on a cash order
            // even if it was applied before the shopper switched to cash.
            offerApplied: isCash ? false : offerApplied,
          });
          close();
          if (checkout().setMessage) {
            checkout().setMessage(
              `${paymentMethod} selected. Placing your order...`,
              "success",
            );
          }
          try {
            await checkout().submitOrder(body, mode);
          } finally {
            if (button) {
              button.disabled = false;
              button.innerHTML = originalText;
            }
          }
        }

        /* ---------- open / close ---------- */
        function resetOfferButton() {
          const button = document.getElementById("payOfferApplyBtn");
          button.textContent = "Apply";
          button.classList.remove("text-slate-400");
          button.disabled = false;
        }

        function open(request) {
          pendingRequest = request;
          lastFocused = document.activeElement;
          offerApplied = false;
          resetOfferButton();
          selectedBank = "";
          selectedWallet = "";
          document.getElementById("payUpiId").value = "";
          showError(document.getElementById("payUpiError"), "");
          showError(document.getElementById("payCardError"), "");
          ["payCardNumber", "payCardExpiry", "payCardCvv"].forEach((id) => {
            document.getElementById(id).value = "";
          });
          document.getElementById("payCardSave").checked = false;
          document.getElementById("payBankSearch").value = "";
          renderBanks();
          renderWallets();
          submitButtonFor("netbanking").disabled = true;
          submitButtonFor("wallet").disabled = true;
          selectMethod("upi");
          refreshAmounts();
          // Wording and eligibility are recalculated per open, so a mode or
          // total changed behind the modal is always reflected.
          refreshCodState();
          refreshContactLabel();
          closeAllSheets();
          closeMoreMenu();
          modal.classList.remove("hidden");
          modal.classList.add("is-open");
          modal.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
          window.setTimeout(() => {
            document.getElementById("payCloseBtn").focus();
          }, 40);
        }

        function close() {
          modal.classList.add("hidden");
          modal.classList.remove("is-open");
          modal.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
          closeAllSheets();
          closeMoreMenu();
          pendingRequest = null;
          if (lastFocused && lastFocused.focus) lastFocused.focus();
        }

        /* ---------- events ---------- */
        methodButtons.forEach((button) => {
          button.addEventListener("click", () =>
            selectMethod(button.dataset.method),
          );
        });

        modal.querySelectorAll("[data-pay-dismiss]").forEach((el) => {
          el.addEventListener("click", close);
        });
        document.getElementById("payCloseBtn").addEventListener("click", close);

        modal.querySelectorAll("[data-pay-sheet-dismiss]").forEach((el) => {
          el.addEventListener("click", closeAllSheets);
        });

        modal.querySelectorAll("[data-pay-submit]").forEach((button) => {
          button.addEventListener("click", confirmPayment);
        });

        document.getElementById("payMoreBtn").addEventListener("click", (e) => {
          e.stopPropagation();
          moreMenu.classList.toggle("hidden");
        });
        document
          .getElementById("payMoreOffersBtn")
          .addEventListener("click", () => openSheet(offersSheet));
        document
          .getElementById("payMoreContactBtn")
          .addEventListener("click", () => {
            refreshContactLabel();
            openSheet(contactSheet);
            contactInput.focus();
          });
        document
          .getElementById("payMoreCancelBtn")
          .addEventListener("click", close);
        modal.addEventListener("click", closeMoreMenu);

        document
          .getElementById("payContactRow")
          .addEventListener("click", () => {
            refreshContactLabel();
            openSheet(contactSheet);
            contactInput.focus();
          });
        document
          .getElementById("payOffersRow")
          .addEventListener("click", () => openSheet(offersSheet));

        // Saving the number here also updates the checkout form, so the two
        // never disagree about where the confirmation should go.
        document
          .getElementById("payContactSaveBtn")
          .addEventListener("click", () => {
            const digits = contactInput.value.replace(/\D/g, "");
            if (digits.length !== 10) {
              showError(contactError, "Enter a 10 digit mobile number.");
              return;
            }
            showError(contactError, "");
            const field = activePhoneField();
            if (field) {
              field.value = digits;
              field.dispatchEvent(new Event("input", { bubbles: true }));
            }
            if (pendingRequest && pendingRequest.body.customer) {
              pendingRequest.body.customer.phone = digits;
            }
            refreshContactLabel();
            closeSheet(contactSheet);
          });

        document
          .getElementById("payOfferApplyBtn")
          .addEventListener("click", (event) => {
            offerApplied = true;
            event.currentTarget.textContent = "Applied";
            event.currentTarget.classList.add("text-slate-400");
            event.currentTarget.disabled = true;
            closeSheet(offersSheet);
          });

        showQrBtn.addEventListener("click", () => {
          renderQr();
          qrBox.classList.remove("is-hidden");
          showQrBtn.classList.add("hidden");
        });

        document
          .getElementById("payBankSearch")
          .addEventListener("input", (event) =>
            renderBanks(event.target.value),
          );

        // Bank and wallet rows are rendered dynamically, so delegate.
        document
          .getElementById("payPaneWrap")
          .addEventListener("click", (event) => {
            const bankRowEl = event.target.closest("[data-bank]");
            if (bankRowEl) {
              selectedBank = bankRowEl.dataset.bank;
              modal
                .querySelectorAll("[data-bank]")
                .forEach((el) =>
                  el.setAttribute(
                    "aria-pressed",
                    el.dataset.bank === selectedBank ? "true" : "false",
                  ),
                );
              submitButtonFor("netbanking").disabled = false;
              return;
            }
            const walletRowEl = event.target.closest("[data-wallet]");
            if (walletRowEl) {
              selectedWallet = walletRowEl.dataset.wallet;
              modal
                .querySelectorAll("[data-wallet]")
                .forEach((el) =>
                  el.setAttribute(
                    "aria-pressed",
                    el.dataset.wallet === selectedWallet ? "true" : "false",
                  ),
                );
              submitButtonFor("wallet").disabled = false;
            }
          });

        /* ---------- input formatting ---------- */
        const cardNumber = document.getElementById("payCardNumber");
        cardNumber.addEventListener("input", () => {
          const digits = cardNumber.value.replace(/\D/g, "").slice(0, 19);
          cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
        });
        const cardExpiry = document.getElementById("payCardExpiry");
        cardExpiry.addEventListener("input", () => {
          const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
          cardExpiry.value =
            digits.length > 2
              ? `${digits.slice(0, 2)} / ${digits.slice(2)}`
              : digits;
        });
        const cardCvv = document.getElementById("payCardCvv");
        cardCvv.addEventListener("input", () => {
          cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
        });
        contactInput.addEventListener("input", () => {
          contactInput.value = contactInput.value
            .replace(/\D/g, "")
            .slice(0, 10);
        });

        document.addEventListener("keydown", (event) => {
          if (event.key !== "Escape" || modal.classList.contains("hidden"))
            return;
          if (!contactSheet.classList.contains("hidden")) {
            closeSheet(contactSheet);
            return;
          }
          if (!offersSheet.classList.contains("hidden")) {
            closeSheet(offersSheet);
            return;
          }
          if (!moreMenu.classList.contains("hidden")) {
            closeMoreMenu();
            return;
          }
          close();
        });

        // Keep the modal total in step with delivery option changes made behind
        // it, and re-check cash eligibility because the fee moves the total.
        document
          .querySelectorAll('input[name="delivery-option"]')
          .forEach((input) =>
            input.addEventListener("change", () => {
              refreshAmounts();
              refreshCodState();
            }),
          );

        // Capture phase: image `error` events do not bubble.
        modal.addEventListener("error", handleBrandImageError, true);
        renderStaticMarks();
        loadCodOptions();

        window.GoSmoothiePayModal = {
          open,
          close,
          refreshAmounts,
          codConfig,
          codEligibility,
        };
      })();
