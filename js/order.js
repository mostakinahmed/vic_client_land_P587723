"use strict";

(() => {
  // ==========================================
  // 1. PRODUCT CONFIGURATION
  // ==========================================
  const PRODUCT = {
    id: "P587723",
    skuID: "",
    name: "HOCO EQ34 Plus ANC ইয়ারবাডস",
    originalPrice: 985,
    discount: 295,
    salePrice: 690,
    minQuantity: 1,
    maxQuantity: 10,
  };

  // ==========================================
  // 2. API CONFIGURATION
  // ==========================================
  const API_URL = "https://api.victusbyte.com/api/order/create-order";

  // ==========================================
  // 3. DOM HELPERS
  // ==========================================
  const $ = (id) => document.getElementById(id);

  const modal = $("order-modal");
  const modalPanel = modal?.firstElementChild;
  const form = $("checkout-modal-form");

  const closeButton = $("close-modal-btn");
  const decreaseButton = $("btn-decrease");
  const increaseButton = $("btn-increase");

  const quantityDisplay = $("display-qty");
  const quantityBadge = $("badge-qty");
  const productSubtotal = $("product-subtotal");

  const summarySubtotal = $("summary-subtotal");
  const summaryShipping = $("summary-shipping");
  const summaryTotal = $("summary-total");

  const submitButton = $("submit-btn");
  const buttonTotalPrice = $("btn-total-price");

  const nameInput = $("order-name");
  const phoneInput = $("order-phone");
  const addressInput = $("order-address");
  const emailInput = $("order-email");
  const noteInput = $("order-note");

  if (!modal || !form) {
    console.error("Order modal or checkout-modal-form was not found.");
    return;
  }

  // ==========================================
  // 4. STATUS MESSAGE
  // ==========================================
  let messageElement = $("order-message");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "order-message";
    messageElement.className =
      "hidden rounded-xl border px-4 py-3 text-sm font-medium";
    messageElement.setAttribute("role", "status");
    messageElement.setAttribute("aria-live", "polite");

    submitButton?.parentElement?.insertBefore(messageElement, submitButton);
  }

  // ==========================================
  // 5. STATE
  // ==========================================
  let quantity = PRODUCT.minQuantity;
  let isSubmitting = false;
  let orderSubmitted = false;

  // ==========================================
  // 6. UTILITY FUNCTIONS
  // ==========================================
  function formatMoney(amount) {
    return `৳${Number(amount).toLocaleString("en-BD", {
      maximumFractionDigits: 2,
    })}`;
  }

  function generateOrderId() {
    const timestamp = Date.now().toString().slice(-7);
    const random = Math.floor(100 + Math.random() * 900);

    return `${timestamp}${random}`;
  }

  function getOrderDateTime12h() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${year}-${month}-${day}   ${String(hours).padStart(
      2,
      "0",
    )}:${minutes} ${ampm}`;
  }

  // Supports both the original and corrected radio values.
  function getShippingCharge() {
    const selected = form.querySelector('input[name="shipping"]:checked');

    if (!selected) return 120;

    const shippingMap = {
      50: 65,
      65: 65,
      80: 80,
      100: 120,
      120: 120,
    };

    return shippingMap[selected.value] ?? 120;
  }

  function getTotals() {
    const subtotal = PRODUCT.salePrice * quantity;
    const totalDiscount = PRODUCT.discount * quantity;
    const shipping = getShippingCharge();

    return {
      quantity,
      originalSubtotal: PRODUCT.originalPrice * quantity,
      totalDiscount,
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }

  function showMessage(message, type = "error") {
    messageElement.textContent = message;

    messageElement.classList.remove(
      "hidden",
      "bg-red-50",
      "text-red-700",
      "border-red-200",
      "bg-emerald-50",
      "text-emerald-700",
      "border-emerald-200",
    );

    if (type === "success") {
      messageElement.classList.add(
        "bg-emerald-50",
        "text-emerald-700",
        "border-emerald-200",
      );
    } else {
      messageElement.classList.add(
        "bg-red-50",
        "text-red-700",
        "border-red-200",
      );
    }
  }

  function clearMessage() {
    messageElement.textContent = "";
    messageElement.classList.add("hidden");
  }

  // ==========================================
  // 7. DYNAMIC PRICE AND QUANTITY UPDATES
  // ==========================================
  function updateOrderSummary() {
    const totals = getTotals();

    if (quantityDisplay) {
      quantityDisplay.textContent = quantity;
    }

    if (quantityBadge) {
      quantityBadge.textContent = `${quantity} টি`;
    }

    if (productSubtotal) {
      productSubtotal.textContent = formatMoney(totals.subtotal);
    }

    if (summarySubtotal) {
      summarySubtotal.textContent = formatMoney(totals.subtotal);
    }

    if (summaryShipping) {
      summaryShipping.textContent = formatMoney(totals.shipping);
    }

    if (summaryTotal) {
      summaryTotal.textContent = formatMoney(totals.total);
    }

    if (buttonTotalPrice) {
      buttonTotalPrice.textContent = formatMoney(totals.total);
    }

    if (decreaseButton) {
      decreaseButton.disabled = quantity <= PRODUCT.minQuantity;

      decreaseButton.classList.toggle("opacity-40", decreaseButton.disabled);
      decreaseButton.classList.toggle(
        "cursor-not-allowed",
        decreaseButton.disabled,
      );
    }

    if (increaseButton) {
      increaseButton.disabled = quantity >= PRODUCT.maxQuantity;

      increaseButton.classList.toggle("opacity-40", increaseButton.disabled);
      increaseButton.classList.toggle(
        "cursor-not-allowed",
        increaseButton.disabled,
      );
    }

    return totals;
  }

  // ==========================================
  // 8. QUANTITY BUTTONS
  // ==========================================
  decreaseButton?.addEventListener("click", () => {
    if (quantity > PRODUCT.minQuantity) {
      quantity--;
      clearMessage();
      updateOrderSummary();
    }
  });

  increaseButton?.addEventListener("click", () => {
    if (quantity < PRODUCT.maxQuantity) {
      quantity++;
      clearMessage();
      updateOrderSummary();
    }
  });

  // ==========================================
  // 9. SHIPPING RADIO BUTTONS
  // ==========================================
  form.querySelectorAll('input[name="shipping"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      clearMessage();
      updateOrderSummary();
    });
  });

  // ==========================================
  // 10. OPEN MODAL
  // ==========================================
  function openModal() {
    if (isSubmitting || orderSubmitted) return;

    clearMessage();

    modal.classList.remove("invisible", "opacity-0", "pointer-events-none");

    modal.classList.add("opacity-100");

    modalPanel?.classList.remove("translate-y-full", "opacity-0");

    modalPanel?.classList.add("translate-y-0", "opacity-100");

    document.body.style.overflow = "hidden";

    updateOrderSummary();
  }

  // ==========================================
  // 11. CLOSE MODAL
  // ==========================================
  function closeModal() {
    if (isSubmitting) return;

    modal.classList.add("opacity-0", "pointer-events-none");

    modal.classList.remove("opacity-100");

    modalPanel?.classList.add("translate-y-full", "opacity-0");

    modalPanel?.classList.remove("translate-y-0", "opacity-100");

    window.setTimeout(() => {
      if (modal.classList.contains("opacity-0")) {
        modal.classList.add("invisible");
      }
    }, 500);

    document.body.style.overflow = "";
  }

  document.querySelectorAll(".open-modal-trigger").forEach((button) => {
    button.addEventListener("click", openModal);
  });

  closeButton?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("invisible")) {
      closeModal();
    }
  });

  // ==========================================
  // 12. COLLECT ALL FORM DATA INTO ONE OBJECT
  // ==========================================
  function buildOrderObject() {
    const totals = getTotals();

    const orderData = {
      order_id: generateOrderId(),

      order_date: getOrderDateTime12h(),

      coupon: null,

      // Matches your AdminSaleFull mode field.
      mode: "Online",

      customer_id: "",

      items: [
        {
          product_id: PRODUCT.id,
          skuID: PRODUCT.skuID,
          product_name: PRODUCT.name,
          quantity: totals.quantity,

          // Original price, before discount.
          product_price: PRODUCT.originalPrice,

          imei: "",

          // Per-unit discount: 985 - 295 = 690.
          discount: PRODUCT.discount,

          product_comments: {
            color: "",
            storage: "",
            phone_price: 0,
          },
        },
      ],

      // Sale price × quantity, before delivery.
      subtotal: totals.subtotal,

      // Subtotal + delivery.
      total_amount: totals.total,

      shipping_address: {
        recipient_name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        address_line1: addressInput.value.trim(),
        email: emailInput.value.trim(),
      },

      courier: {
        name: "N/A",
        consignment_id: "N/A",
        delivery_status: "Pending",
        payment_status: "Pending",
        payment_method: "COD",
        del_type: "COD",
        total_cod_amount: totals.total,
        delivery_charge: totals.shipping,
        cod_fee: 0,
        cod_percent: 1,
      },

      // Persist this only after adding it to your Mongoose schema.
      order_note: noteInput?.value.trim() || "",
    };

    return orderData;
  }

  // ==========================================
  // 13. SUBMIT ORDER TO YOUR BACKEND
  // ==========================================
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting || orderSubmitted) return;

    clearMessage();

    if (!form.reportValidity()) return;

    const phone = phoneInput.value.trim().replace(/[\s()-]/g, "");

    // Bangladesh mobile validation.
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) {
      showMessage("সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।");

      phoneInput.focus();
      return;
    }

    const orderData = buildOrderObject();

    isSubmitting = true;

    const originalButtonHTML = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.classList.add("opacity-70", "cursor-not-allowed");

    submitButton.textContent = "অর্ডার পাঠানো হচ্ছে...";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
        );
      }

      const savedOrderId = result.order?.order_id || orderData.order_id;

      orderSubmitted = true;

      showMessage(
        `আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। অর্ডার নম্বর: ${savedOrderId}। আমাদের প্রতিনিধি আপনার সঙ্গে যোগাযোগ করবেন।`,
        "success",
      );

      submitButton.textContent = "অর্ডার সফলভাবে গ্রহণ করা হয়েছে";

      submitButton.classList.remove("bg-[#f66107]", "hover:bg-[#a97520]");

      submitButton.classList.add("bg-emerald-700");

      // Useful for testing your request payload.
      console.log("Order payload:", orderData);
      console.log("Backend response:", result);
    } catch (error) {
      console.error("Order submission error:", error);

      showMessage(
        error.message ||
          "অর্ডার জমা দেওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      );

      submitButton.innerHTML = originalButtonHTML;

      submitButton.classList.remove(
        "opacity-70",
        "cursor-not-allowed",
        "bg-emerald-700",
      );

      submitButton.classList.add("bg-[#f66107]", "hover:bg-[#a97520]");
    } finally {
      isSubmitting = false;
      submitButton.disabled = orderSubmitted;
    }
  });

  // ==========================================
  // 14. INITIALIZE MODAL TOTALS
  // ==========================================
  updateOrderSummary();
})();
