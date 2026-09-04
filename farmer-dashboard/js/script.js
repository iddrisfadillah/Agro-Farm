// ===================== AgroMarket Portal — Shared Interactions =====================

const API_BASE = 'http://127.0.0.1:8000/api';

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();          // ← Load real data
  loadMyProducts();          // ← Add this line
  loadSellerOrders();
  loadConversations();
  initTagInput();
  initUploadBox();
  initDescriptionCounter();
  initFormSubmit();
  initChatForm();
  initSupportTicket();
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

/* ---------- Tag input (Basic Information) ---------- */

function initTagInput() {
  const tagBox = document.getElementById('tag-box');
  const tagInput = document.getElementById('tag-input');
  if (!tagBox || !tagInput) return;

  function removeChip(e) {
    if (e.target.matches('[data-remove-tag]')) {
      e.target.closest('.tag-chip').remove();
    }
  }
  tagBox.addEventListener('click', removeChip);

  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagInput.value.trim()) {
      e.preventDefault();
      addTagChip(tagInput.value.trim());
      tagInput.value = '';
    }
    if (e.key === 'Backspace' && !tagInput.value) {
      const chips = tagBox.querySelectorAll('.tag-chip');
      if (chips.length) chips[chips.length - 1].remove();
    }
  });

  function addTagChip(text) {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${escapeHtml(text)} <button type="button" data-remove-tag>×</button>`;
    tagBox.insertBefore(chip, tagInput);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Product media upload (Fixed) ---------- */
let selectedFiles = [];   // Store the real files here

function initUploadBox() {
  const box = document.getElementById('upload-box');
  const fileInput = document.getElementById('file-input');
  const grid = document.getElementById('thumb-grid');
  if (!box || !fileInput || !grid) return;

  // Clear mock images
  grid.innerHTML = '';

  box.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = ''; // allow selecting same file again
  });

  ['dragover', 'dragenter'].forEach(evt =>
    box.addEventListener(evt, (e) => {
      e.preventDefault();
      box.classList.add('dragover');
    })
  );

  ['dragleave', 'drop'].forEach(evt =>
    box.addEventListener(evt, (e) => {
      e.preventDefault();
      box.classList.remove('dragover');
    })
  );

  box.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });

  function handleFiles(files) {
    files.forEach(file => {
      selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const slot = document.createElement('div');
        slot.className = 'thumb-slot';
        slot.style.backgroundImage = `url('${e.target.result}')`;

        const remove = document.createElement('button');
        remove.className = 'remove';
        remove.type = 'button';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          // Remove from selectedFiles array
          const index = Array.from(grid.children).indexOf(slot);
          selectedFiles.splice(index, 1);
          slot.remove();
        });

        slot.appendChild(remove);
        grid.appendChild(slot);
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ---------- Description character counter ---------- */

function initDescriptionCounter() {
  const textarea = document.getElementById('description');
  const counter = document.getElementById('char-count');
  if (!textarea || !counter) return;
  const max = 600;

  const update = () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${max} characters`;
    counter.style.color = len > max ? 'var(--red-500)' : '';
  };
  textarea.addEventListener('input', update);
  update();
}

/* ---------- Customer Chat ---------- */

function initChatForm() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const history = document.querySelector('.chat-history');
  if (!form || !input || !history) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const row = document.createElement('div');
    row.className = 'msg-row outgoing';
    row.innerHTML = `
      <div class="msg-bubble outgoing">${escapeHtml(text)}<span class="msg-time">Just now</span></div>
      <div class="chat-avatar sm" style="background-image:url('https://i.pravatar.cc/80?img=5')"></div>
    `;
    history.appendChild(row);
    history.scrollTop = history.scrollHeight;
    input.value = '';

    // TODO: replace with a real send-message API call once the backend is connected
  });
}

/* ---------- Support Center ---------- */

function initSupportTicket() {
  const btn = document.getElementById('open-ticket-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // TODO: replace with real ticket-creation flow / API call
    showToast('Ticket request sent — support will follow up shortly');
  });
}

/* ---------- Form submit / Publish Listing ---------- */
function initFormSubmit() {
  const form = document.getElementById('listing-form');
  const draftBtn = document.getElementById('save-draft-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in first');
      return;
    }

    // Validation
    const name = document.getElementById('product-name').value.trim();
    const categoryId = document.getElementById('category').value;
    const price = document.getElementById('price').value;
    const stock = document.getElementById('stock').value;
    const fileInput = document.getElementById('file-input');

    if (!name) {
      showToast('Please enter a product name');
      return;
    }
    if (!categoryId) {
      showToast('Please select a category');
      return;
    }
    if (!price || !stock) {
      showToast('Please enter price and stock quantity');
      return;
    }
    if (selectedFiles.length === 0) {
    showToast('Please upload at least one product image');
    return;
   }

    // Prepare FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category_id', categoryId);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', price);
    formData.append('unit', document.getElementById('unit-type').value || 'kg');
    formData.append('quantity_available', stock);
    formData.append('harvest_date', document.getElementById('harvest-date').value || '');
    
    // Optional: use first tag as certification
    const firstTag = document.querySelector('#tag-box .tag-chip');
    if (firstTag) {
      formData.append('certification', firstTag.textContent.replace('×', '').trim());
    }

    // Append real selected files
    selectedFiles.forEach(file => {
   formData.append('images[]', file);
   });

    try {
      showToast('Uploading product...');

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await res.json();

      if (data.status === true) {
        showToast('Product submitted successfully! Waiting for admin approval.');
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        const firstError = Object.values(data.errors || {})[0]?.[0];
        showToast(firstError || data.message || 'Failed to add product');
        console.error(data);
      }
    } catch (error) {
      console.error(error);
      showToast('Network error. Please try again.');
    }
  });

  // Draft button (still temporary)
  if (draftBtn) {
    draftBtn.addEventListener('click', () => {
      showToast('Draft saved (not connected yet)');
    });
  }
}



/* ---------- Load Seller Dashboard Data ---------- */
async function loadDashboard() {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in first');
    window.location.href = '../login/login.html';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/seller/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load dashboard');
      return;
    }

    const d = data.dashboard;

    // ===== Update Statistics Cards =====
    const statValues = document.querySelectorAll('.stat-value');

    // 1. Total Revenue
    if (statValues[0]) {
      statValues[0].textContent = `$${Number(d.total_earnings || 0).toLocaleString()}`;
    }

    // 2. Active Listings
    if (statValues[1]) {
      statValues[1].textContent = d.total_products || 0;
    }

    // 3. Orders awaiting fulfillment
    if (statValues[2]) {
      statValues[2].textContent = d.pending_orders || 0;
    }

    // ===== Update Welcome Name =====
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const welcome = document.querySelector('.page-head h1');
    if (welcome && user.name) {
      welcome.textContent = `Welcome back, ${user.name.split(' ')[0]}`;
    }

    // ===== Update Recent Orders Table =====
    updateRecentOrders(d.recent_orders || []);

  } catch (error) {
    console.error(error);
    showToast('Network error while loading dashboard');
  }
}

function updateRecentOrders(orders) {
  const tbody = document.querySelector('.card-table tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-muted" style="text-align:center; padding: 20px;">
          No recent orders yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const item = order.items?.[0];
    const productName = item ? item.product_name : 'Multiple products';
    const status = order.status || 'pending';
    const statusClass = status.toLowerCase();

    // Simple time formatting
    const time = new Date(order.created_at).toLocaleString();

    return `
      <tr>
        <td>
          <div class="cust">
            <span class="initial">OR</span>
            Order #${order.order_number}
          </div>
        </td>
        <td>${productName}</td>
        <td><span class="pill ${statusClass}">${status}</span></td>
        <td class="text-muted">${time}</td>
      </tr>
    `;
  }).join('');
}

/* ---------- Load My Products (Active Listings) ---------- */
async function loadMyProducts() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/my-products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      console.error(data.message);
      return;
    }

    renderProducts(data.products || []);

  } catch (error) {
    console.error('Failed to load products:', error);
  }
}

function renderProducts(products) {
  const grid = document.querySelector('.listing-grid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #777;">
        <p>You have no products yet.</p>
        <a href="add-listing.html" class="btn btn-primary" style="margin-top: 12px;">
          + Add New Product
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const image = product.images?.[0]?.image_path
      ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
      : 'https://via.placeholder.com/400x300?text=No+Image';

    const stockStatus = product.quantity_available < 10 ? 'Low Stock' : 'In Stock';
    const badgeClass = product.quantity_available < 10 ? 'low' : '';

    return `
      <div class="listing-card">
        <div class="thumb" style="background-image:url('${image}')">
          <span class="badge ${badgeClass}">${stockStatus}</span>
        </div>
        <div class="body">
          <h3>${product.name}</h3>
          <div class="meta">
            <strong>$${Number(product.price).toFixed(2)}</strong> / ${product.unit} · 
            ${product.quantity_available} ${product.unit} available
          </div>
          <div class="actions">
          <button class="btn btn-outline" onclick="viewProduct(${product.id})">View</button>
          <button class="btn btn-outline" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn btn-outline" style="color:#c0392b;" onclick="deleteProduct(${product.id})">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


/* ---------- Load Seller Orders ---------- */
async function loadSellerOrders() {
  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Please log in first');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/seller/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load orders');
      return;
    }

    renderOrdersTable(data.orders || []);
    updateOrderStats(data.orders || []);

  } catch (error) {
    console.error(error);
    showToast('Network error while loading orders');
  }
}

function renderOrdersTable(orders) {
  const tbody = document.querySelector('.card-table tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 30px; color: #777;">
          No orders yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const item = order.items?.[0];
    const productName = item 
      ? `${item.product_name} (${item.quantity} ${item.unit})` 
      : 'Multiple products';

    const total = order.items?.reduce((sum, i) => sum + Number(i.total), 0) || order.total;
    const status = order.status || 'pending';
    const date = new Date(order.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    return `
      <tr>
        <td class="mono">#${order.order_number}</td>
        <td class="text-muted">${date}</td>
        <td>Buyer #${order.user_id}</td>
        <td>${productName}</td>
        <td>GH₵ ${Number(total).toFixed(2)}</td>
        <td><span class="pill ${status}">${status}</span></td>
        <td class="row-actions">
          <button class="icon-btn-sm" onclick="viewOrder(${order.id})" aria-label="View">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="icon-btn-sm" onclick="updateOrderStatus(${order.id})" aria-label="Update status">
            <i class="fa-solid fa-pen"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateOrderStats(orders) {
  const totalOrders = orders.length;
  const pending = orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length;

  const statValues = document.querySelectorAll('.stats-row .stat-value');
  if (statValues[0]) statValues[0].textContent = totalOrders;
  if (statValues[1]) statValues[1].textContent = pending;
}

// Simple helpers (you can improve later)
function viewOrder(id) {
  showToast(`Viewing order #${id} (details page coming soon)`);
}

function updateOrderStatus(id) {
  const newStatus = prompt('Enter new status (confirmed, processing, packed, shipped, delivered, cancelled):');
  if (!newStatus) return;

  updateStatusOnServer(id, newStatus);
}

async function updateStatusOnServer(orderId, status) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (data.status) {
      showToast('Order status updated successfully');
      loadSellerOrders(); // refresh the table
    } else {
      showToast(data.message || 'Failed to update status');
    }
  } catch (error) {
    showToast('Network error');
  }
}

/* ---------- Customer Chat (Real Backend) ---------- */
let currentConversationId = null;

async function loadConversations() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    if (!data.status) return;

    renderConversationList(data.conversations || []);
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
}

function renderConversationList(conversations) {
  const list = document.querySelector('.chat-list');
  if (!list) return;

  // Keep the search box
  const searchBox = list.querySelector('.chat-search');
  list.innerHTML = '';
  if (searchBox) list.appendChild(searchBox);

  if (conversations.length === 0) {
  list.innerHTML += `<div style="padding: 20px; color: #777; text-align: center;">No conversations yet</div>`;
  
  // Clear the right side mock data
  const history = document.querySelector('.chat-history');
  const header = document.querySelector('.chat-header-user');
  
  if (history) {
    history.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #999;">
        <i class="fa-solid fa-comments" style="font-size: 40px; margin-bottom: 15px;"></i>
        <p>Select a conversation to start chatting</p>
      </div>
    `;
  }
  
  if (header) {
    header.innerHTML = `
      <div>
        <h3>No conversation selected</h3>
        <span class="status-online">—</span>
      </div>
    `;
  }
  
  return;
}

  conversations.forEach((conv, index) => {
    const otherUser = conv.buyer_id === JSON.parse(localStorage.getItem('user') || '{}').id
      ? conv.seller
      : conv.buyer;

    const lastMsg = conv.last_message?.message || 'No messages yet';
    const time = conv.last_message_at
      ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const item = document.createElement('a');
    item.className = `chat-list-item ${index === 0 ? 'active' : ''}`;
    item.href = '#';
    item.innerHTML = `
      <div class="chat-avatar" style="background-image:url('https://i.pravatar.cc/80?img=${otherUser?.id || 10}')"></div>
      <div class="chat-list-item-body">
        <div class="row">
          <strong>${otherUser?.name || 'User'}</strong>
          <span class="time">${time}</span>
        </div>
        <p>${lastMsg.substring(0, 40)}${lastMsg.length > 40 ? '...' : ''}</p>
      </div>
    `;

    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      currentConversationId = conv.id;
      loadMessages(conv.id);
      updateChatHeader(otherUser);
    });

    list.appendChild(item);

    // Auto load the first conversation
    if (index === 0) {
      currentConversationId = conv.id;
      loadMessages(conv.id);
      updateChatHeader(otherUser);
    }
  });
}

function updateChatHeader(user) {
  const header = document.querySelector('.chat-header-user');
  if (!header || !user) return;

  header.innerHTML = `
    <div class="chat-avatar lg" style="background-image:url('https://i.pravatar.cc/80?img=${user.id || 10}')"></div>
    <div>
      <h3>${user.name}</h3>
      <span class="status-online"><i class="fa-solid fa-circle"></i> Online</span>
    </div>
  `;
}

async function loadMessages(conversationId) {
  const token = localStorage.getItem('token');
  const history = document.querySelector('.chat-history');
  if (!history) return;

  try {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();
    if (!data.status) return;

    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

    history.innerHTML = data.messages.map(msg => {
      const isOutgoing = msg.sender_id === currentUserId;
      const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (isOutgoing) {
        return `
          <div class="msg-row outgoing">
            <div class="msg-bubble outgoing">
              ${msg.message}
              <span class="msg-time">${time}</span>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="msg-row">
            <div class="chat-avatar sm" style="background-image:url('https://i.pravatar.cc/80?img=${msg.sender_id}')"></div>
            <div class="msg-bubble incoming">
              ${msg.message}
              <span class="msg-time">${time}</span>
            </div>
          </div>
        `;
      }
    }).join('');

    history.scrollTop = history.scrollHeight;
  } catch (error) {
    console.error(error);
  }
}

// Update the existing chat form submit
function initChatForm() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  if (!form || !input) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !currentConversationId) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${currentConversationId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      if (data.status) {
        input.value = '';
        loadMessages(currentConversationId); // refresh messages
        loadConversations(); // refresh list (last message)
      } else {
        showToast(data.message || 'Failed to send message');
      }
    } catch (error) {
      showToast('Network error');
    }
  });
}


/* ---------- View / Edit Product ---------- */

async function viewProduct(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/my-products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status || !data.product) {
      showToast(data.message || 'Product not found');
      return;
    }

    if (data.product.status !== 'approved') {
      showToast('This product is still pending admin approval. It cannot be viewed publicly yet.');
      return;
    }

    // Open public product page
    window.open(`../marketplace/product.html?id=${id}`, '_blank');

  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

async function editProduct(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/my-products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load product');
      return;
    }

    // Store product temporarily and redirect to edit page
    // For now we'll use a simple prompt-based update (quick version)
    // Later we can build a full edit form page

    openEditModal(data.product);

  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

function openEditModal(product) {
  const newName = prompt('Product Name:', product.name);
  if (newName === null) return;

  const newPrice = prompt('Price:', product.price);
  if (newPrice === null) return;

  const newQty = prompt('Quantity Available:', product.quantity_available);
  if (newQty === null) return;

  updateProduct(product.id, {
    name: newName,
    price: newPrice,
    quantity_available: newQty
  });
}

async function updateProduct(id, payload) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/my-products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.status) {
      showToast('Product updated successfully');
      // Refresh the product list
      if (typeof loadMyProducts === 'function') {
        loadMyProducts();
      } else if (typeof loadSellerDashboard === 'function') {
        loadSellerDashboard();
      }
    } else {
      showToast(data.message || 'Failed to update product');
    }
  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/my-products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (data.status) {
      showToast('Product deleted successfully');
      // Refresh product list
      if (typeof loadMyProducts === 'function') {
        loadMyProducts();
      } else if (typeof loadSellerDashboard === 'function') {
        loadSellerDashboard();
      } else {
        location.reload();
      }
    } else {
      showToast(data.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}