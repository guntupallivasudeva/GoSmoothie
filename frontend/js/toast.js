/**
 * GoSmoothie — Shared Toast Notification Service
 *
 * Usage:
 *   showToast("Item added to cart");                    // success (default)
 *   showToast("Something went wrong", "error");        // error — stays until dismissed
 *   showToast("Check your input", "warning");          // warning — auto-dismiss 5s
 *   showToast(backendErrorResponse);                   // auto-reads .error or .message from response object
 *
 * Include this file after bootstrap-icons CSS is loaded (uses bi-* icon classes).
 * Requires /css/toast.css for keyframe animations.
 */
(function initToastService(global) {
  "use strict";

  if (global.showToast) return; // already loaded

  let activeToast = null;

  /**
   * Show a toast notification.
   * @param {string|object} messageOrResponse - Text message or a backend response object with .error/.message
   * @param {"success"|"error"|"warning"} [type="success"]
   */
  function showToast(messageOrResponse, type) {
    // If an object is passed (e.g. backend JSON response), extract the message
    let message = messageOrResponse;
    if (typeof messageOrResponse === "object" && messageOrResponse !== null) {
      message =
        messageOrResponse.error ||
        messageOrResponse.message ||
        JSON.stringify(messageOrResponse);
      // Auto-detect type from HTTP-like status if not provided
      if (!type) {
        type =
          messageOrResponse.success === false || messageOrResponse.error
            ? "error"
            : "success";
      }
    }
    if (!type) type = "success";

    // Remove previous toast immediately
    if (activeToast && document.body.contains(activeToast)) {
      activeToast.remove();
    }

    const isError = type === "error";
    const isWarning = type === "warning";

    const icon = isError
      ? "bi-exclamation-circle"
      : isWarning
        ? "bi-exclamation-triangle"
        : "bi-check2-circle";
    const bgClass = isError
      ? "bg-red-50 border-red-200"
      : isWarning
        ? "bg-amber-50 border-amber-200"
        : "bg-green-50 border-green-200";
    const iconColor = isError
      ? "text-red-500"
      : isWarning
        ? "text-amber-500"
        : "text-green-500";
    const textColor = isError
      ? "text-red-800"
      : isWarning
        ? "text-amber-800"
        : "text-green-800";
    const progressColor = isError
      ? "bg-red-400"
      : isWarning
        ? "bg-amber-400"
        : "bg-green-400";
    const heading = isError ? "Error" : isWarning ? "Warning" : "Success";

    const toast = document.createElement("div");
    toast.className =
      "fixed top-6 right-6 z-[9999] w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-hidden " +
      bgClass +
      " animate-[slideUp_0.3s_ease-out]";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.innerHTML =
      '<div class="flex items-center gap-3 px-4 py-3.5 ' +
      textColor +
      '">' +
      '<i class="bi ' +
      icon +
      " " +
      iconColor +
      ' text-4xl shrink-0 animate-[iconPop_0.4s_ease-out]"></i>' +
      '<div class="flex-1 min-w-0">' +
      '<p class="font-bold text-sm">' +
      heading +
      "</p>" +
      '<p class="text-sm mt-0.5 opacity-80">' +
      escapeHtml(message) +
      "</p>" +
      "</div>" +
      '<button class="toast-close shrink-0 ' +
      iconColor +
      ' text-xl hover:opacity-70 transition" aria-label="Close">' +
      '<i class="bi bi-x-lg"></i>' +
      "</button>" +
      "</div>" +
      (!isError
        ? '<div class="h-1 w-full bg-black/5"><div class="toast-progress h-full ' +
          progressColor +
          '" style="animation: progress-shrink ' +
          (isWarning ? "5" : "8") +
          's linear forwards;"></div></div>'
        : "");

    document.body.appendChild(toast);
    activeToast = toast;

    // Close button
    toast.querySelector(".toast-close").addEventListener("click", function () {
      dismissToast(toast);
    });

    // Auto-dismiss success/warning (error stays until manually closed)
    if (!isError) {
      var dismissTime = isWarning ? 5000 : 8000;
      setTimeout(function () {
        if (document.body.contains(toast)) {
          dismissToast(toast);
        }
      }, dismissTime);
    }
  }

  function dismissToast(toast) {
    toast.style.animation = "slideDown 0.3s ease-in forwards";
    setTimeout(function () {
      if (document.body.contains(toast)) toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 300);
  }

  function escapeHtml(str) {
    var s = String(str == null ? "" : str);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Expose globally
  global.showToast = showToast;
})(window);

/**
 * GoSmoothie — Custom Tooltip for truncated/overflow text.
 *
 * Any element with `data-tip="full text here"` will show a styled tooltip on hover.
 * Also auto-detects elements with CSS text-overflow (truncate) and shows their full
 * textContent when it overflows.
 */
(function initTooltip(global) {
  "use strict";

  // Only enable tooltips on admin pages
  var isAdminPage = /admin/.test(global.location.pathname);
  if (!isAdminPage) return;

  var tip = null;
  var hideTimer = null;

  function createTip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "gs-tooltip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    return tip;
  }

  function showTip(el, text) {
    if (!text || !text.trim()) return;
    clearTimeout(hideTimer);
    var t = createTip();
    t.textContent = text;
    t.classList.add("visible");

    // Position below the element
    var rect = el.getBoundingClientRect();
    var tipW = Math.min(420, window.innerWidth - 32);
    t.style.maxWidth = tipW + "px";

    // Temporarily show to measure
    t.style.left = "0px";
    t.style.top = "0px";
    var tipRect = t.getBoundingClientRect();

    var left = rect.left;
    var top = rect.bottom + 8;

    // Keep within viewport
    if (left + tipRect.width > window.innerWidth - 16) {
      left = window.innerWidth - tipRect.width - 16;
    }
    if (left < 8) left = 8;

    // If below goes off screen, show above
    if (top + tipRect.height > window.innerHeight - 16) {
      top = rect.top - tipRect.height - 8;
      t.style.setProperty("--arrow-pos", "bottom");
    }

    t.style.left = left + "px";
    t.style.top = top + "px";
  }

  function hideTip() {
    hideTimer = setTimeout(function () {
      if (tip) tip.classList.remove("visible");
    }, 80);
  }

  document.addEventListener(
    "mouseenter",
    function (e) {
      var el = e.target;

      // Explicit data-tip attribute (for programmatically truncated text with "...")
      var tipText = el.getAttribute && el.getAttribute("data-tip");
      if (tipText) {
        showTip(el, tipText);
        return;
      }

      // Auto-detect: only for elements with .truncate class that are actually overflowing
      if (
        el.nodeType === 1 &&
        el.classList &&
        el.classList.contains("truncate")
      ) {
        if (
          el.scrollWidth > el.clientWidth &&
          el.textContent &&
          el.textContent.trim().length > 3
        ) {
          showTip(el, el.textContent.trim());
        }
      }
    },
    true,
  );

  document.addEventListener(
    "mouseleave",
    function (e) {
      var el = e.target;
      if (
        (el.getAttribute && el.getAttribute("data-tip")) ||
        (el.classList && el.classList.contains("truncate"))
      ) {
        hideTip();
      }
    },
    true,
  );
})(window);
