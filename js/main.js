"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. PRODUCT CONFIGURATION
  // ==========================================
  const PRODUCT = {
    id: "P587723",
    skuID: "",
    name: "Hoco EQ34 Plus",
    originalPrice: 985,
    discount: 295,
    salePrice: 690,
    minQty: 1,
    maxQty: 10,
  };

  const API_URL = "https://api.victusbyte.com/api/order/create-order";

  const DEFAULT_SHIPPING = "100";

  const $ = (id) => document.getElementById(id);

  // ==========================================
  // 2. ELEMENTS
  // ==========================================
  const modal = $("order-modal");
  const modalPanel = modal?.firstElementChild;
  const form = $("checkout-modal-form");

  const statusScreen = $("order-status-screen");
  const processingState = $("order-processing-state");
  const successState = $("order-success-state");
  const errorState = $("order-error-state");

  const submitBtn = $("submit-btn");
  const decreaseBtn = $("btn-decrease");
  const increaseBtn = $("btn-increase");

  const nameInput = $("order-name");
  const phoneInput = $("order-phone");
  const addressInput = $("order-address");
  const emailInput = $("order-email");
  const noteInput = $("order-note");

  const requiredElements = {
    modal,
    modalPanel,
    form,
    statusScreen,
    processingState,
    successState,
    errorState,
    submitBtn,
    decreaseBtn,
    increaseBtn,
    nameInput,
    phoneInput,
    addressInput,
    quantityDisplay: $("display-qty"),
    badgeQty: $("badge-qty"),
    productSubtotal: $("product-subtotal"),
    summarySubtotal: $("summary-subtotal"),
    summaryShipping: $("summary-shipping"),
    summaryTotal: $("summary-total"),
    buttonTotal: $("btn-total-price"),
  };

  const missingElements = Object.entries(requiredElements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error(
      "Victus Byte order system: Missing HTML elements:",
      missingElements,
    );
    return;
  }

  // ==========================================
  // 3. STATE
  // ==========================================
  let quantity = 1;
  let isSubmitting = false;
  let isModalOpen = false;

  let lastPayload = null;
  let lastTotals = null;
  let lastOrderId = null;

  // Background-scroll restoration state.
  let savedScrollY = 0;
  let savedBodyStyles = {};
  let savedHtmlStyles = {};

  // ==========================================
  // 4. HELPERS
  // ==========================================
  function money(amount) {
    return "৳" + Number(amount).toLocaleString("en-US");
  }

  function banglaNumber(number) {
    return Number(number).toLocaleString("bn-BD");
  }

  function showFormError(message) {
    const errorElement = $("order-form-message");

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
    } else {
      alert(message);
    }
  }

  function clearFormError() {
    const errorElement = $("order-form-message");

    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.add("hidden");
    }
  }

  function getSelectedShippingRadio() {
    return document.querySelector('input[name="shipping"]:checked');
  }

  // Radio values are retained from your existing HTML.
  // 50  -> ৳65
  // 80  -> ৳80
  // 100 -> ৳120
  function getShippingCharge() {
    const selected = getSelectedShippingRadio();

    switch (selected?.value) {
      case "50":
        return 65;

      case "80":
        return 80;

      case "100":
        return 120;

      default:
        return 120;
    }
  }

  function getTotals() {
    const subtotal = PRODUCT.salePrice * quantity;
    const shipping = getShippingCharge();

    return {
      quantity,
      subtotal,
      shipping,
      discount: PRODUCT.discount * quantity,
      total: subtotal + shipping,
    };
  }

  function generateOrderId() {
    const ms = Date.now().toString().slice(-4);
    const random = Math.floor(10 + Math.random() * 90).toString();
    return ms + random;
  }

  // ==========================================
  // 5. PRICE CALCULATION
  // ==========================================
  function recalculate() {
    const totals = getTotals();

    $("display-qty").textContent = banglaNumber(quantity);

    $("badge-qty").textContent = `${banglaNumber(quantity)} টি`;

    $("product-subtotal").textContent = money(totals.subtotal);

    $("summary-subtotal").textContent = money(totals.subtotal);

    $("summary-shipping").textContent = money(totals.shipping);

    $("summary-total").textContent = money(totals.total);

    $("btn-total-price").textContent = money(totals.total);

    decreaseBtn.disabled = quantity <= PRODUCT.minQty;

    increaseBtn.disabled = quantity >= PRODUCT.maxQty;

    decreaseBtn.classList.toggle("opacity-50", decreaseBtn.disabled);

    increaseBtn.classList.toggle("opacity-50", increaseBtn.disabled);

    return totals;
  }

  decreaseBtn.addEventListener("click", () => {
    if (quantity > PRODUCT.minQty) {
      quantity -= 1;
      recalculate();
    }
  });

  increaseBtn.addEventListener("click", () => {
    if (quantity < PRODUCT.maxQty) {
      quantity += 1;
      recalculate();
    }
  });

  document.querySelectorAll('input[name="shipping"]').forEach((radio) => {
    radio.addEventListener("change", recalculate);
  });

  // ==========================================
  // 6. MODAL OPEN / CLOSE
  // Locks background scrolling and restores
  // the exact page position after closing.
  // ==========================================
  function openModal() {
    if (isModalOpen) return;

    if (isSubmitting) return;

    // Start a fresh form after a completed order.
    if (lastOrderId) {
      resetForm();
    }

    // Remember current page position.
    savedScrollY = window.scrollY;

    // Save original inline body styles.
    savedBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };

    savedHtmlStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
    };

    // Compensate for a disappearing desktop scrollbar.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Lock the background page.
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    isModalOpen = true;

    // Show modal.
    modal.classList.remove("invisible", "opacity-0", "pointer-events-none");

    modal.classList.add("opacity-100");
    modal.setAttribute("aria-hidden", "false");

    // Animate panel into view.
    requestAnimationFrame(() => {
      modalPanel.classList.remove("translate-y-full", "opacity-0");

      modalPanel.classList.add("translate-y-0", "opacity-100");
    });
  }

  function closeModal(force = false) {
    if (!isModalOpen) return;
    if (isSubmitting && !force) return;

    isModalOpen = false;

    // Animate modal panel downward while fading out.
    modalPanel.classList.remove("translate-y-0", "opacity-100");
    modalPanel.classList.add("translate-y-full", "opacity-0");

    modal.classList.remove("opacity-100");
    modal.classList.add("opacity-0", "pointer-events-none");

    modal.setAttribute("aria-hidden", "true");

    // Restore scrolling after animation finishes.
    window.setTimeout(() => {
      modal.classList.add("invisible");

      Object.assign(document.body.style, savedBodyStyles);
      Object.assign(document.documentElement.style, savedHtmlStyles);

      window.scrollTo(0, savedScrollY);
    }, 600);
  }

  document.querySelectorAll(".open-modal-trigger").forEach((button) => {
    button.addEventListener("click", openModal);
  });

  $("close-modal-btn")?.addEventListener("click", () => closeModal());

  // Close only when the backdrop itself is clicked.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isModalOpen) {
      closeModal();
    }
  });

  // ==========================================
  // 7. ORDER STATUS SCREENS
  // The status screen must be inside modalPanel.
  // ==========================================
  function showOrderState(state) {
    form.classList.add("hidden");

    statusScreen.classList.remove("hidden");
    statusScreen.classList.add("flex");

    processingState.classList.add("hidden");
    successState.classList.add("hidden");
    errorState.classList.add("hidden");

    if (state === "processing") {
      processingState.classList.remove("hidden");
    }

    if (state === "success") {
      successState.classList.remove("hidden");
    }

    if (state === "error") {
      errorState.classList.remove("hidden");
    }
  }

  function showOrderForm() {
    statusScreen.classList.add("hidden");
    statusScreen.classList.remove("flex");

    processingState.classList.add("hidden");
    successState.classList.add("hidden");
    errorState.classList.add("hidden");

    form.classList.remove("hidden");

    clearFormError();
  }

  // ==========================================
  // 8. BUILD ORDER PAYLOAD
  // ==========================================
  function buildOrderPayload(orderId = generateOrderId()) {
    const totals = getTotals();

    const rawPhone = phoneInput.value.trim().replace(/[\s()-]/g, "");

    let normalizedPhone = rawPhone;

    if (normalizedPhone.startsWith("+88")) {
      normalizedPhone = normalizedPhone.slice(3);
    } else if (normalizedPhone.startsWith("88")) {
      normalizedPhone = normalizedPhone.slice(2);
    }

    const payload = {
      order_id: orderId,
      order_date: new Date().toISOString(),
      coupon: "",
      mode: "Online",
      customer_id: null,

      items: [
        {
          product_id: PRODUCT.id,
          skuID: PRODUCT.skuID,
          product_name: PRODUCT.name,
          quantity: totals.quantity,

          // Original product price and per-unit discount.
          product_price: PRODUCT.originalPrice,
          discount: PRODUCT.discount,

          product_comments: {
            color: "",
            storage: "",
            phone_price: 0,
          },

          imei: "",
        },
      ],

      subtotal: totals.subtotal,
      total_amount: totals.total,

      payment: {
        method: "COD",
        status: "Pending",
      },

      shipping_address: {
        recipient_name: nameInput.value.trim(),
        phone: normalizedPhone,
        email: emailInput?.value.trim() || "Null",
        address_line1: addressInput.value.trim(),
      },

      courier: {
        courier_name: "",
        delivery_charge: totals.shipping,
        payment_method: "COD",
        total_cod_amount: totals.total,
        cod_fee: 0,
        cod_percent: 1,
      },

      // Keep this field only if supported by your backend schema.
      order_note: noteInput?.value.trim() || "",
    };

    return {
      payload,
      totals,
    };
  }

  // ==========================================
  // 9. SUCCESS SCREEN
  // ==========================================
  function renderSuccess(orderId, totals) {
    $("success-order-id").textContent = orderId;

    $("success-order-qty").textContent = `${banglaNumber(totals.quantity)} টি`;

    $("success-shipping").textContent = money(totals.shipping);

    $("success-order-total").textContent = money(totals.total);
  }

  // ==========================================
  // 10. SUBMIT ORDER TO API
  // ==========================================
  async function sendOrder(payload, totals) {
    if (isSubmitting) return;

    isSubmitting = true;
    submitBtn.disabled = true;

    showOrderState("processing");

    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || result?.success !== true) {
        throw new Error(
          result?.message ||
            result?.error ||
            `অর্ডার জমা দেওয়া যায়নি (HTTP ${response.status})`,
        );
      }

      const savedOrder = result.order || result.data || {};

      const actualOrderId = savedOrder.order_id || payload.order_id;

      lastOrderId = actualOrderId;

      renderSuccess(actualOrderId, totals);
      showOrderState("success");
    } catch (error) {
      console.error("Victus Byte order submission error:", error);

      $("order-error-message").textContent =
        error.message ||
        "নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";

      showOrderState("error");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
    }
  }

  // ==========================================
  // 11. FORM SUBMISSION
  // ==========================================
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    clearFormError();

    const name = nameInput.value.trim();

    const phone = phoneInput.value.trim().replace(/[\s()-]/g, "");

    const address = addressInput.value.trim();

    if (!name) {
      showFormError("আপনার নাম লিখুন।");
      nameInput.focus();
      return;
    }

    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(phone)) {
      showFormError("সঠিক বাংলাদেশি মোবাইল নম্বর দিন।");

      phoneInput.focus();
      return;
    }

    if (!address) {
      showFormError("আপনার সম্পূর্ণ ঠিকানা লিখুন.");
      addressInput.focus();
      return;
    }

    if (!getSelectedShippingRadio()) {
      showFormError("ডেলিভারি এলাকা নির্বাচন করুন।");
      return;
    }

    // Validate optional email if provided.
    if (emailInput?.value.trim() && !emailInput.validity.valid) {
      showFormError("সঠিক ইমেইল ঠিকানা লিখুন।");
      emailInput.focus();
      return;
    }

    const built = buildOrderPayload();

    lastPayload = built.payload;
    lastTotals = built.totals;

    await sendOrder(lastPayload, lastTotals);
  });

  // ==========================================
  // 12. RETRY
  // ==========================================
  $("order-retry-btn")?.addEventListener("click", async () => {
    if (!lastPayload || !lastTotals || isSubmitting) {
      return;
    }

    // Reuse the same payload and order ID on retry.
    // The backend should prevent duplicate orders.
    await sendOrder(lastPayload, lastTotals);
  });

  // ==========================================
  // 13. RESET FORM
  // ==========================================
  function resetForm() {
    if (isSubmitting) return;

    form.reset();

    quantity = 1;
    lastPayload = null;
    lastTotals = null;
    lastOrderId = null;

    const defaultShipping = document.querySelector(
      `input[name="shipping"][value="${DEFAULT_SHIPPING}"]`,
    );

    if (defaultShipping) {
      defaultShipping.checked = true;
    }

    showOrderForm();
    recalculate();
  }

  // ==========================================
  // 14. SUCCESS / ERROR CLOSE BUTTONS
  // ==========================================
  $("success-close-btn")?.addEventListener("click", () => {
    if (isSubmitting) return;

    resetForm();
    closeModal();
  });

  $("error-close-btn")?.addEventListener("click", () => {
    if (isSubmitting) return;

    // Keep the user's information if they want to try again.
    showOrderForm();
  });

  // ==========================================
  // 15. INITIALIZE
  // ==========================================
  showOrderForm();
  recalculate();

  console.log("Victus Byte order system initialized successfully.");
});
