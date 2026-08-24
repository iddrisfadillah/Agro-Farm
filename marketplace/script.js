// ===================== AgroMarket — Marketplace Script =====================
// Used only by: marketplace/*.html (public buyer-facing site)

document.addEventListener('DOMContentLoaded', () => {
  initAddToCart();
  initFavoriteButtons();
  initGallery();
  initQtyStepper();
  initTabs();
  initClearFilters();
  initCartPage();
  initCheckoutPage();
  initSettingsNav();
  initFollowButton();
});

/* ---------- Toast ---------- */

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-text').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------- Add to cart (homepage, shop, product page) ---------- */

function initAddToCart() {
  document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // TODO: replace with a real "add to cart" API call / cart state update
      showToast('Added to cart');
      bumpCartBadge();
    });
  });

  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      const qty = document.getElementById('qty-value')?.value || 1;
      // TODO: replace with a real "add to cart" API call
      showToast(`Added ${qty} to cart`);
      bumpCartBadge();
    });
  }
}

function bumpCartBadge() {
  document.querySelectorAll('.badge-count').forEach((el) => {
    el.textContent = (parseInt(el.textContent, 10) || 0) + 1;
  });
}

/* ---------- Favorite / heart buttons ---------- */

function initFavoriteButtons() {
  document.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.toggle('active');
      const icon = btn.querySelector('i');
      icon.classList.toggle('fa-regular');
      icon.classList.toggle('fa-solid');
      // TODO: replace with a real favorites API call
    });
  });
}

/* ---------- Product gallery ---------- */

function initGallery() {
  const main = document.getElementById('gallery-main');
  if (!main) return;
  document.querySelectorAll('.gallery-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      main.style.backgroundImage = `url('${thumb.dataset.img}')`;
    });
  });
}

/* ---------- Quantity stepper (product page) ---------- */

function initQtyStepper() {
  const minus = document.getElementById('qty-minus');
  const plus = document.getElementById('qty-plus');
  const value = document.getElementById('qty-value');
  if (!minus || !plus || !value) return;

  minus.addEventListener('click', () => {
    const n = Math.max(1, parseInt(value.value, 10) - 1);
    value.value = n;
  });
  plus.addEventListener('click', () => {
    const n = parseInt(value.value, 10) + 1;
    value.value = n;
  });
}

/* ---------- Tabs (product detail page) ---------- */

function initTabs() {
  const nav = document.getElementById('tab-nav');
  if (!nav) return;
  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
}

/* ---------- Shop page: clear filters ---------- */

function initClearFilters() {
  const btn = document.getElementById('clear-filters-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filter-panel input[type="number"]').forEach(inp => inp.value = '');
    showToast('Filters cleared');
  });
}

/* ---------- Cart page: quantity + remove + totals ---------- */

function initCartPage() {
  const container = document.getElementById('cart-items');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const minusBtn = e.target.closest('[data-qty-minus]');
    const plusBtn = e.target.closest('[data-qty-plus]');
    const removeBtn = e.target.closest('[data-remove]');

    if (minusBtn || plusBtn) {
      const item = (minusBtn || plusBtn).closest('.cart-item');
      const input = item.querySelector('.qty-stepper input');
      let qty = parseInt(input.value, 10);
      qty = minusBtn ? Math.max(1, qty - 1) : qty + 1;
      input.value = qty;
      item.dataset.qty = qty;
      const price = parseFloat(item.dataset.price);
      item.querySelector('.cart-item-total').textContent = `$${(price * qty).toFixed(2)}`;
      recalculateCartTotals();
    }

    if (removeBtn) {
      const item = removeBtn.closest('.cart-item');
      item.style.transition = 'opacity 0.2s ease';
      item.style.opacity = '0';
      setTimeout(() => {
        item.remove();
        recalculateCartTotals();
        // TODO: replace with a real "remove from cart" API call
      }, 200);
    }
  });

  recalculateCartTotals();
}

function recalculateCartTotals() {
  const items = document.querySelectorAll('#cart-items .cart-item');
  const subtotalEl = document.getElementById('summary-subtotal');
  if (!subtotalEl) return;

  let subtotal = 0;
  items.forEach((item) => {
    subtotal += parseFloat(item.dataset.price) * parseInt(item.dataset.qty, 10);
  });

  const delivery = items.length > 0 ? 5.00 : 0;
  const platformFee = subtotal * 0.05;
  const total = subtotal + delivery + platformFee;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-delivery').textContent = `$${delivery.toFixed(2)}`;
  document.getElementById('summary-platform').textContent = `$${platformFee.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;

  const emptyCart = document.getElementById('empty-cart');
  const cartItemsWrap = document.getElementById('cart-items');
  if (emptyCart && cartItemsWrap) {
    const isEmpty = items.length === 0;
    emptyCart.style.display = isEmpty ? 'block' : 'none';
    cartItemsWrap.style.display = isEmpty ? 'none' : 'flex';
  }
}

/* ---------- Checkout page ---------- */

function initCheckoutPage() {
  const options = document.getElementById('payment-options');
  if (options) {
    options.addEventListener('change', (e) => {
      if (e.target.name !== 'payment') return;
      document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
      e.target.closest('.payment-option').classList.add('active');

      ['momo', 'card', 'cash'].forEach((key) => {
        const fields = document.getElementById(`fields-${key}`);
        if (fields) fields.style.display = e.target.value === key ? 'block' : 'none';
      });
    });
  }

  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: replace with a real order-placement API call
      document.getElementById('checkout-view').style.display = 'none';
      document.getElementById('confirmation-view').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Order placed successfully');
    });
  }
}

/* ---------- Account / Settings sub-nav (account.html) ---------- */

function initSettingsNav() {
  const nav = document.getElementById('account-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-panel]');
    if (!btn) return;
    nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`panel-${btn.dataset.panel}`)?.classList.add('active');
  });

  const saveBtn = document.getElementById('save-profile-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // TODO: replace with a real profile-update API call
      showToast('Profile updated');
    });
  }
}

/* ---------- Farm profile: follow button ---------- */

function initFollowButton() {
  const btn = document.getElementById('follow-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const nowFollowing = !btn.classList.contains('active');
    btn.classList.toggle('active', nowFollowing);
    btn.innerHTML = nowFollowing
      ? '<i class="fa-solid fa-heart"></i>Following'
      : '<i class="fa-regular fa-heart"></i>Follow Farm';
    // TODO: replace with a real follow/unfollow API call
    showToast(nowFollowing ? 'Following Green Valley Orchards' : 'Unfollowed');
  });
}