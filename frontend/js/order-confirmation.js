// --- Block 1 ---
const params = new URLSearchParams(location.search);
      const id = params.get("orderId");
      if (id) {
        document.getElementById("orderId").textContent = id;
      } else {
        document.getElementById("orderId").textContent = "Order Processing";
      }
      if (window.lucide) window.lucide.createIcons();
