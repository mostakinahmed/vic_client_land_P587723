document.addEventListener("DOMContentLoaded", () => {
  const UNIT_PRICE = 1650;
  let currentQty = 1;
  let currentShipping = 100;
  let closeTimer = null;

  // Modal elements
  const modal = document.getElementById("order-modal");
  const modalPanel = modal?.firstElementChild;
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalTriggers = document.querySelectorAll(".open-modal-trigger");

  // Quantity and price elements
  const btnDecrease = document.getElementById("btn-decrease");
  const btnIncrease = document.getElementById("btn-increase");
  const displayQty = document.getElementById("display-qty");
  const badgeQty = document.getElementById("badge-qty");
  const productSubtotal = document.getElementById("product-subtotal");
  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryShipping = document.getElementById("summary-shipping");
  const summaryTotal = document.getElementById("summary-total");
  const btnTotalPrice = document.getElementById("btn-total-price");

  const shippingRadios = document.querySelectorAll('input[name="shipping"]');

  const modalForm = document.getElementById("checkout-modal-form");

  // Update totals safely
  function recalculate() {
    const subtotal = UNIT_PRICE * currentQty;
    const grandTotal = subtotal + currentShipping;

    if (displayQty) displayQty.textContent = currentQty;
    if (badgeQty) badgeQty.textContent = `${currentQty} টি`;
    if (productSubtotal) productSubtotal.textContent = `${subtotal} TK`;
    if (summarySubtotal) summarySubtotal.textContent = `${subtotal} TK`;
    if (summaryShipping) summaryShipping.textContent = `${currentShipping} TK`;
    if (summaryTotal) summaryTotal.textContent = `${grandTotal} TK`;
    if (btnTotalPrice) btnTotalPrice.textContent = `${grandTotal} TK`;
  }

  // Open modal: slide from bottom to top
  function openModal() {
    if (!modal || !modalPanel) {
      console.error("Modal not found. Check #order-modal in your HTML.");
      return;
    }

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    modal.classList.remove(
      "hidden",
      "invisible",
      "opacity-0",
      "pointer-events-none",
    );
    modal.classList.add("opacity-100");

    // Set the starting position
    modalPanel.classList.remove("translate-y-0", "opacity-100");
    modalPanel.classList.add("translate-y-full", "opacity-0");

    // Force the browser to apply the starting position
    void modalPanel.offsetHeight;

    // Animate upward
    modalPanel.classList.remove("translate-y-full", "opacity-0");
    modalPanel.classList.add("translate-y-0", "opacity-100");

    document.body.style.overflow = "hidden";
  }

  // Close modal: slide down
  function closeModal() {
    if (!modal || !modalPanel) return;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    modalPanel.classList.remove("translate-y-0", "opacity-100");
    modalPanel.classList.add("translate-y-full", "opacity-0");

    modal.classList.remove("opacity-100");
    modal.classList.add("opacity-0", "pointer-events-none");

    closeTimer = setTimeout(() => {
      modal.classList.add("invisible");
      document.body.style.overflow = "";
      closeTimer = null;
    }, 500);
  }

  // Open buttons
  modalTriggers.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  // Close button
  closeModalBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    closeModal();
  });

  // Close by clicking backdrop
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Close with Escape
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      modal &&
      !modal.classList.contains("invisible") &&
      !modal.classList.contains("pointer-events-none")
    ) {
      closeModal();
    }
  });

  // Quantity increase
  btnIncrease?.addEventListener("click", (event) => {
    event.preventDefault();
    currentQty++;
    recalculate();
  });

  // Quantity decrease
  btnDecrease?.addEventListener("click", (event) => {
    event.preventDefault();

    if (currentQty > 1) {
      currentQty--;
      recalculate();
    }
  });

  // Delivery charge selection
  shippingRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      currentShipping = Number(event.target.value) || 0;
      recalculate();
    });
  });

  // Order submission
  modalForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("order-name");
    const phone = document.getElementById("order-phone");
    const address = document.getElementById("order-address");
    const email = document.getElementById("order-email");
    const note = document.getElementById("order-note");

    const orderData = {
      product: "HOCO EQ34 Plus ANC Earbuds",
      unitPrice: UNIT_PRICE,
      quantity: currentQty,
      deliveryCharge: currentShipping,
      totalAmount: UNIT_PRICE * currentQty + currentShipping,
      customerName: name?.value.trim() || "",
      phone: phone?.value.trim() || "",
      address: address?.value.trim() || "",
      email: email?.value.trim() || null,
      note: note?.value.trim() || null,
    };

    console.log("Order data:", orderData);

    // Demo only: connect your backend API to save real orders.
    alert(
      `ধন্যবাদ ${orderData.customerName}! আপনার অর্ডারটি সফলভাবে নেওয়া হয়েছে। সর্বমোট বিল: ${orderData.totalAmount} TK। খুব দ্রুতই আমাদের টিম আপনাকে কল করবে।`,
    );

    closeModal();
    modalForm.reset();

    currentQty = 1;
    currentShipping = 100;

    const defaultShipping = document.querySelector(
      'input[name="shipping"][value="100"]',
    );

    if (defaultShipping) {
      defaultShipping.checked = true;
    }

    recalculate();
  });

  // Initial calculation
  recalculate();
});
