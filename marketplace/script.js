// ===================== AgroMarket — Marketplace Script =====================
// Used only by: marketplace/*.html (public buyer-facing site)

const API_BASE = 'http://127.0.0.1:8000/api';


document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
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
  initProductSearch();

  // Cart page
  if (document.getElementById('cart-items')) {
  loadCart();

  }
   // Checkout page
  if (document.getElementById('checkout-form')) {
  loadCheckout();
  initCheckoutForm();

  }

  // Single product page
  if (document.querySelector('.product-detail-grid')) {
  loadProductDetail();
  }
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

  // const form = document.getElementById('checkout-form');
  // if (form) {
  //   form.addEventListener('submit', (e) => {
  //     e.preventDefault();
  //     // TODO: replace with a real order-placement API call
  //     document.getElementById('checkout-view').style.display = 'none';
  //     document.getElementById('confirmation-view').style.display = 'block';
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //     showToast('Order placed successfully');
  //   });
  // }
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


/* ---------- Load Products for Shop Page ---------- */
async function loadProducts(filters = {}) {
  try {
    const params = new URLSearchParams();

    if (filters.search) {
      params.append('search', filters.search);
    }


    const res = await fetch(`${API_BASE}/products?${params}`);
    const data = await res.json();

    if (!data.status) {
      console.error(data.message);
      return;
    }

    const products = data.products?.data || data.products || [];
   renderProducts(products);
   updateProductCount(products.length);

  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('Failed to load products');
  }
}

function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #777;">
        <p>No products found.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const image = product.images?.[0]?.image_path
      ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
      : 'https://via.placeholder.com/400x300?text=No+Image';

    const farmName = product.user?.name || 'Local Farm';
    const badge = product.certification 
      ? `<span class="badge organic">${product.certification}</span>` 
      : '';

    return `
      <a href="product.html?id=${product.id}" class="product-card">
        <div class="thumb" style="background-image:url('${image}')">
          <div class="badges">${badge}</div>
          <button class="fav-btn" aria-label="Save" onclick="event.preventDefault()">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
        <div class="body">
          <h3>${product.name}</h3>
          <span class="farm">${farmName}</span>
          <div class="price-row">
            <span class="price">$${Number(product.price).toFixed(2)} <span class="unit">/ ${product.unit}</span></span>
            <button class="add-btn" aria-label="Add to cart" 
                    onclick="event.preventDefault(); addToCart(${product.id})">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function updateProductCount(count) {
  const subtitle = document.querySelector('.shop-head .text-muted');
  if (subtitle) {
    subtitle.textContent = `${count} items available from verified farms.`;
  }
}

async function addToCart(productId, quantity = 1) {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in to add items to cart');
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: quantity
      })
    });

    const data = await res.json();

    if (data.status === true) {
      showToast('Added to cart successfully');

      // Update cart badge
      const badge = document.querySelector('.badge-count');
      if (badge) {
        const current = parseInt(badge.textContent) || 0;
        badge.textContent = current + 1;
      }
    } else {
      showToast(data.message || 'Failed to add to cart');
    }
  } catch (error) {
    console.error(error);
    showToast('Network error. Please try again.');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-text').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ---------- Cart Page ---------- */
async function loadCart() {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in to view your cart');
    // Optional: redirect to login
    // window.location.href = '../login/login.html';
    showEmptyCart();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load cart');
      showEmptyCart();
      return;
    }

    const items = data.cart?.items || [];
    const subtotal = data.subtotal || 0;

    if (items.length === 0) {
      showEmptyCart();
      return;
    }

    renderCartItems(items, subtotal);
    updateCartBadge(items.length);

  } catch (error) {
    console.error(error);
    showToast('Network error while loading cart');
    showEmptyCart();
  }
}

function showEmptyCart() {
  const cartItems = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const summary = document.querySelector('.order-summary');

  if (cartItems) cartItems.style.display = 'none';
  if (emptyCart) emptyCart.style.display = 'block';
  if (summary) summary.style.display = 'none';
}

function renderCartItems(items, subtotal) {
  const container = document.getElementById('cart-items');
  if (!container) return;

  // Keep the "Continue Shopping" link
  container.innerHTML = items.map(item => {
    const product = item.product || {};
    const image = product.images?.[0]?.image_path
      ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
      : 'https://via.placeholder.com/200';

    const lineTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);

    return `
      <div class="cart-item" data-id="${item.id}" data-price="${item.price}" data-qty="${item.quantity}">
        <div class="cart-item-thumb" style="background-image:url('${image}')"></div>
        <div class="cart-item-body">
          <strong>${product.name || 'Product'}</strong>
          <span class="text-muted">$${Number(item.price).toFixed(2)} / ${product.unit || 'unit'}</span>
          <button class="remove-link" onclick="removeCartItem(${item.id})">
            <i class="fa-solid fa-trash-can"></i> Remove
          </button>
        </div>
        <div class="qty-stepper">
          <button type="button" onclick="updateCartQty(${item.id}, ${Number(item.quantity) - 1})">
            <i class="fa-solid fa-minus"></i>
          </button>
          <input type="text" value="${item.quantity}" readonly>
          <button type="button" onclick="updateCartQty(${item.id}, ${Number(item.quantity) + 1})">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <div class="cart-item-total">$${lineTotal}</div>
      </div>
    `;
  }).join('') + `
    <a href="shop.html" class="continue-shopping">
      <i class="fa-solid fa-arrow-left"></i> Continue Shopping
    </a>
  `;

  // Update summary
  const delivery = 20.00;
  const platformFee = (subtotal * 0.05).toFixed(2);
  const total = (Number(subtotal) + delivery + Number(platformFee)).toFixed(2);

  document.getElementById('summary-subtotal').textContent = `$${Number(subtotal).toFixed(2)}`;
  document.getElementById('summary-delivery').textContent = `$${delivery.toFixed(2)}`;
  document.getElementById('summary-platform').textContent = `$${platformFee}`;
  document.getElementById('summary-total').textContent = `$${total}`;
}

async function updateCartQty(itemId, newQty) {
  if (newQty < 1) {
    removeCartItem(itemId);
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ quantity: newQty })
    });

    const data = await res.json();
    if (data.status) {
      loadCart(); // refresh
    } else {
      showToast(data.message || 'Failed to update quantity');
    }
  } catch (error) {
    showToast('Network error');
  }
}

async function removeCartItem(itemId) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    if (data.status) {
      showToast('Item removed');
      loadCart();
    } else {
      showToast(data.message || 'Failed to remove item');
    }
  } catch (error) {
    showToast('Network error');
  }
}

function updateCartBadge(count) {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = count;
}



/* ---------- Checkout Page ---------- */
async function loadCheckout() {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please log in to checkout');
    setTimeout(() => window.location.href = '../login/login.html', 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status || !data.cart?.items?.length) {
      showToast('Your cart is empty');
      setTimeout(() => window.location.href = 'cart.html', 1200);
      return;
    }

    renderCheckoutSummary(data.cart.items, data.subtotal || 0);

  } catch (error) {
    console.error(error);
    showToast('Failed to load checkout data');
  }
}

function renderCheckoutSummary(items, subtotal) {
  // Update Order Review section
  const reviewSection = document.querySelector('.settings-card:last-of-type');
  if (reviewSection) {
    const lines = items.map(item => {
      const product = item.product || {};
      const image = product.images?.[0]?.image_path
        ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
        : 'https://via.placeholder.com/100';

      const lineTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);

      return `
        <div class="review-line">
          <div class="cart-item-thumb sm" style="background-image:url('${image}')"></div>
          <span>${product.name || 'Product'} × ${item.quantity}</span>
          <strong>$${lineTotal}</strong>
        </div>
      `;
    }).join('');

    // Keep the header and replace the rest
    const head = reviewSection.querySelector('.settings-card-head');
    reviewSection.innerHTML = '';
    if (head) reviewSection.appendChild(head);
    reviewSection.insertAdjacentHTML('beforeend', lines);
  }

  // Update Order Summary
  const delivery = 20.00;
  const platformFee = (subtotal * 0.05).toFixed(2);
  const total = (Number(subtotal) + delivery + Number(platformFee)).toFixed(2);

  const summaryRows = document.querySelectorAll('.order-summary .summary-row');
  if (summaryRows[0]) summaryRows[0].querySelector('span:last-child').textContent = `$${Number(subtotal).toFixed(2)}`;
  if (summaryRows[1]) summaryRows[1].querySelector('span:last-child').textContent = `$${delivery.toFixed(2)}`;
  if (summaryRows[2]) summaryRows[2].querySelector('span:last-child').textContent = `$${platformFee}`;
  if (summaryRows[3]) summaryRows[3].querySelector('span:last-child').textContent = `$${total}`;
}

function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in first');
      return;
    }

    const fullName = document.getElementById('full-name')?.value;
    const phone = document.getElementById('phone')?.value;
    const address = document.getElementById('address')?.value;
    const city = document.getElementById('city')?.value;
    const region = document.getElementById('region')?.value;

    if (!fullName || !phone || !address || !city) {
      showToast('Please fill in all required delivery details');
      return;
    }

    const deliveryAddress = `${address}, ${city}, ${region}`;

    try {
      showToast('Placing your order...');

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          delivery_method: 'delivery',
          delivery_address: deliveryAddress,
          delivery_latitude: null,
          delivery_longitude: null,
          notes: `Phone: ${phone} | Name: ${fullName}`
        })
      });

      const data = await res.json();

      if (data.status === true) {
        // Show confirmation view
        document.getElementById('checkout-view').style.display = 'none';
        document.getElementById('confirmation-view').style.display = 'block';

        // Update order number
        const orderNumberEl = document.getElementById('order-number');
        if (orderNumberEl && data.order?.order_number) {
          orderNumberEl.textContent = `#${data.order.order_number}`;
        }
        // Update Total Paid
        const metaDivs = document.querySelectorAll('.confirmation-meta > div');
       if (metaDivs.length >= 3) {
        const totalStrong = metaDivs[2].querySelector('strong');
       if (totalStrong && data.order.total) {
       totalStrong.textContent = `$${Number(data.order.total).toFixed(2)}`;
       }
       }

      //   showToast('Order placed successfully!');
      // }
       showToast('Order placed successfully!');
       window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      else {
        showToast(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error. Please try again.');
    }
  });
}


/* ---------- Single Product Page ---------- */
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showToast('Product not found');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    const data = await res.json();

    if (!data.status || !data.product) {
      showToast(data.message || 'Product not found or not yet approved');
      return;
    }

    renderProductDetail(data.product);
  } catch (error) {
    console.error(error);
    showToast('Failed to load product');
  }
}

function renderProductDetail(product) {
  // Title
  document.title = `${product.name} · AgroMarket`;

  // Breadcrumb last item
  const breadcrumbSpan = document.querySelector('.breadcrumb span:last-child');
  if (breadcrumbSpan) breadcrumbSpan.textContent = product.name;

  // Main image
  const mainImage = product.images?.[0]?.image_path
    ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
    : 'https://via.placeholder.com/800';

  const galleryMain = document.getElementById('gallery-main');
  if (galleryMain) {
    galleryMain.style.backgroundImage = `url('${mainImage}')`;
  }

  // Thumbnails
  const thumbsContainer = document.querySelector('.gallery-thumbs');
  if (thumbsContainer && product.images?.length) {
    thumbsContainer.innerHTML = product.images.map((img, index) => {
      const url = `http://127.0.0.1:8000/storage/${img.image_path}`;
      return `
        <button class="gallery-thumb ${index === 0 ? 'active' : ''}"
                data-img="${url}"
                style="background-image:url('${url}')">
        </button>
      `;
    }).join('');

    // Re-init gallery click handlers
    initGallery();
  }

  // Product name
  const title = document.querySelector('.product-info h1');
  if (title) title.textContent = product.name;

  // Description
  const lede = document.querySelector('.product-lede');
  if (lede) lede.textContent = product.description || 'Fresh produce from local farms.';

  // Price
  const priceEl = document.querySelector('.purchase-price');
  if (priceEl) {
    priceEl.innerHTML = `$${Number(product.price).toFixed(2)} <span class="unit">/ ${product.unit}</span>`;
  }

  // Certification badge
  const badges = document.querySelector('.product-info .badges');
  if (badges && product.certification) {
    badges.innerHTML = `<span class="badge organic">${product.certification}</span>`;
  }

  // Farm name
  const farmLink = document.querySelector('.info-chip a');
  if (farmLink) {
    farmLink.textContent = product.seller?.name || product.user?.name || 'Local Farm';
  }

  // Stock
  const stockBadge = document.querySelector('.purchase-stock .badge');
  if (stockBadge) {
    const qty = Number(product.quantity_available);
    stockBadge.textContent = qty > 0 ? 'In Stock' : 'Out of Stock';
    stockBadge.className = qty > 0 ? 'badge in-stock' : 'badge out-of-stock';
  }

  // Wire Add to Cart button
const addBtn = document.getElementById('add-to-cart-btn');
if (addBtn) {
  // Check if current user is the seller of this product
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isOwner = currentUser && (
    currentUser.id === product.user_id ||
    currentUser.id === product.seller?.id
  );

  if (isOwner) {
    // Hide Add to Cart for the product owner
    addBtn.style.display = 'none';

    // Optional: also hide quantity stepper
    const qtyStepper = document.querySelector('.purchase-actions .qty-stepper');
    if (qtyStepper) qtyStepper.style.display = 'none';
  } else {
    addBtn.style.display = '';
    addBtn.onclick = () => {
      const qty = Number(document.getElementById('qty-value')?.value || 1);
      addToCart(product.id, qty);
    };
  }
}
}

/* ---------- Product Search ---------- */
function initProductSearch() {
  const searchInput = document.querySelector('.header-search input');
  if (!searchInput) return;

  let timeout = null;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      const keyword = e.target.value.trim();
      loadProducts({ search: keyword });
    }, 400); // wait 400ms after user stops typing
  });
}