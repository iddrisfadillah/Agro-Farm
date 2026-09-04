// ===================== AgroMarket — Admin Portal Script =====================
// Used only by: admin-dashboard/*.html
const API_BASE = 'http://127.0.0.1:8000/api';
document.addEventListener('DOMContentLoaded', () => {
  initActivityTabs();
  initModerationActions();
  initUserManagementTable();
  initRefreshButton();
  initSettingsPage();

  // Only run on product moderation page
  if (document.getElementById('moderation-tbody')) {
    loadPendingProducts();
  }

  // Refresh button
  // const refreshBtn = document.getElementById('refresh-btn');
  // if (refreshBtn) {
  //   refreshBtn.addEventListener('click', loadPendingProducts);
  // }
  // Product Moderation page
  if (document.getElementById('moderation-tbody')) {
    loadPendingProducts();
  }

  // Admin Dashboard homepage
  if (document.querySelector('.stats-row')) {
    loadAdminDashboard();
  }

  // Refresh button on moderation page
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadPendingProducts);
  }

  // User Management page
  if (document.querySelector('.card-table tbody') && window.location.pathname.includes('user-management')) {
    loadUsers();
  }

  // Global Orders page
  if (window.location.pathname.includes('global-orders')) {
    loadGlobalOrders();
  }

  initSettingsPage();
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

  //risky
  async function loadPendingProducts() {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in as Admin');
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/products/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load products');
      return;
    }

    renderPendingProducts(data.products || []);
  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

function renderPendingProducts(products) {
  const tbody = document.getElementById('moderation-tbody');
  const emptyState = document.getElementById('empty-state');
  const countLabel = document.getElementById('count-label');

  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (countLabel) countLabel.textContent = 'No pending listings';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = products.map(product => {
    const image = product.images?.[0]?.image_path
      ? `http://127.0.0.1:8000/storage/${product.images[0].image_path}`
      : 'https://via.placeholder.com/100';

    const farmerName = product.user?.name || 'Unknown Farmer';
    const category = product.category?.name || 'Uncategorized';

    return `
      <tr data-id="${product.id}">
        <td>
          <div class="product-cell">
            <div class="product-thumb" style="background-image:url('${image}')"></div>
            <div class="product-cell-body">
              <strong>${product.name}</strong>
              <span>ID: ${product.id}</span>
            </div>
          </div>
        </td>
        <td>${farmerName}</td>
        <td><span class="pill gray">${category}</span></td>
        <td>${Number(product.price).toFixed(2)} / ${product.unit}</td>
        <td><span class="pill blue">Pending Review</span></td>
        <td class="row-actions">
          <button class="icon-btn-sm" aria-label="View details" onclick="viewProduct(${product.id})">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="icon-btn-sm approve" aria-label="Approve" onclick="approveProduct(${product.id})">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="icon-btn-sm reject" aria-label="Reject" onclick="rejectProduct(${product.id})">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (countLabel) {
    countLabel.textContent = `Showing ${products.length} pending listing${products.length !== 1 ? 's' : ''}`;
  }
}

async function approveProduct(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (data.status) {
      showToast('Product approved successfully');
      loadPendingProducts(); // refresh list
    } else {
      showToast(data.message || 'Failed to approve');
    }
  } catch (error) {
    showToast('Network error');
  }
}

async function rejectProduct(id) {
  const reason = prompt('Enter rejection reason (optional):') || 'Does not meet quality standards';
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ rejection_reason: reason })
    });

    const data = await res.json();

    if (data.status) {
      showToast('Product rejected');
      loadPendingProducts();
    } else {
      showToast(data.message || 'Failed to reject');
    }
  } catch (error) {
    showToast('Network error');
  }
}

function viewProduct(id) {
  // Simple view for now
  window.open(`../marketplace/product.html?id=${id}`, '_blank');
}

















/* ---------- Dashboard: activity chart tabs ---------- */

function initActivityTabs() {
  const tabs = document.querySelectorAll('.section-head .tabs button');
  if (!tabs.length) return;
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // TODO: swap chart data source (All vs Revenue) once real analytics are wired up
    });
  });
}

/* ---------- Product Moderation: approve / reject ---------- */

function initModerationActions() {
  const tbody = document.getElementById('moderation-tbody');
  if (!tbody) return;

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('[data-row]');
    const action = btn.dataset.action;

    // TODO: replace with a real API call to approve/reject the listing
    if (action === 'approve') {
      showToast('Listing approved');
    } else if (action === 'reject') {
      showToast('Listing rejected');
    }

    row.style.transition = 'opacity 0.2s ease';
    row.style.opacity = '0';
    setTimeout(() => {
      row.remove();
      updateModerationCount();
    }, 200);
  });
}

function updateModerationCount() {
  const tbody = document.getElementById('moderation-tbody');
  const emptyState = document.getElementById('empty-state');
  const countLabel = document.getElementById('count-label');
  if (!tbody) return;

  const remaining = tbody.querySelectorAll('[data-row]').length;
  if (countLabel) countLabel.textContent = `Showing ${remaining} of ${remaining} pending listings`;
  if (emptyState) emptyState.style.display = remaining === 0 ? 'block' : 'none';
}

function initRefreshButton() {
  const btn = document.getElementById('refresh-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // TODO: replace with a real refetch of the moderation queue
    showToast('Queue refreshed');
  });
}

/* ---------- Settings page ---------- */

function initSettingsPage() {
  const nav = document.getElementById('settings-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-panel]');
    if (!btn) return;

    nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`panel-${btn.dataset.panel}`);
    if (target) target.classList.add('active');
  });

  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // TODO: replace with a real API call to persist settings
      showToast('Settings saved');
    });
  }

  const discardBtn = document.getElementById('discard-btn');
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      showToast('Changes discarded');
    });
  }

  const changePasswordBtn = document.getElementById('change-password-btn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      const current = document.getElementById('current-password').value;
      const next = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-new-password').value;

      if (!current || !next) {
        showToast('Fill in your current and new password');
        return;
      }
      if (next !== confirm) {
        showToast("New passwords don't match");
        return;
      }
      // TODO: replace with a real password-change API call
      showToast('Password updated');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-new-password').value = '';
    });
  }

  const signOutAllBtn = document.getElementById('signout-all-btn');
  if (signOutAllBtn) {
    signOutAllBtn.addEventListener('click', () => {
      // TODO: replace with a real session-revocation API call
      showToast('Signed out of all sessions');
    });
  }
}

/* ---------- User Management: select all / bulk actions ---------- */

function initUserManagementTable() {
  const selectAll = document.getElementById('select-all');
  const selectedCount = document.getElementById('selected-count');
  if (!selectAll) return;

  const rowChecks = () => document.querySelectorAll('.row-check');

  function updateCount() {
    const checked = document.querySelectorAll('.row-check:checked').length;
    if (selectedCount) selectedCount.textContent = `${checked} selected`;
  }

  selectAll.addEventListener('change', () => {
    rowChecks().forEach(cb => { cb.checked = selectAll.checked; });
    updateCount();
  });

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('row-check')) {
      const all = rowChecks();
      const checked = document.querySelectorAll('.row-check:checked');
      selectAll.checked = all.length === checked.length;
      updateCount();
    }
  });
}

/* ---------- Admin Dashboard Stats ---------- */
async function loadAdminDashboard() {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in as Admin');
    setTimeout(() => {
      window.location.href = '../login/login.html';
    }, 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
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

    renderDashboardStats(data.stats);
  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

function renderDashboardStats(stats) {
  const cards = document.querySelectorAll('.stat-card');

  if (cards.length < 4) return;

  // Card 1: Total Revenue
  cards[0].querySelector('.stat-value').textContent =
    `GH₵ ${Number(stats.total_revenue || 0).toLocaleString()}`;

  // Card 2: Active Users
  cards[1].querySelector('.stat-value').textContent =
    Number(stats.total_users || 0).toLocaleString();

  // Card 3: Pending Tasks (pending products + pending sellers)
  const pendingTasks = (stats.pending_products || 0) + (stats.pending_sellers || 0);
  cards[2].querySelector('.stat-value').textContent = pendingTasks;
  cards[2].querySelector('.stat-sub').innerHTML =
    `<i class="fa-solid fa-circle-exclamation"></i> ${stats.pending_products || 0} products pending review`;

  // Card 4: Active Listings (approved products)
  cards[3].querySelector('.stat-value').textContent =
    Number(stats.approved_products || 0).toLocaleString();
}


/* ---------- User Management ---------- */
async function loadUsers(filters = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in as Admin');
    setTimeout(() => window.location.href = '../login/login.html', 1200);
    return;
  }

  try {
    const params = new URLSearchParams();
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (!data.status) {
      showToast(data.message || 'Failed to load users');
      return;
    }

    const users = data.users?.data || data.users || [];
    renderUsers(users, data.users);

  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

function renderUsers(users, pagination = null) {
  const tbody = document.querySelector('.card-table tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#777;">
          No users found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => {
    const initials = (user.name || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const roleClass = user.role === 'buyer' ? 'buyer' :
                      user.role === 'seller' ? '' : 'logistics';

    const roleLabel = user.role === 'seller' ? 'Farmer' :
                      user.role === 'buyer' ? 'Buyer' :
                      user.role === 'admin' ? 'Admin' : user.role;

    const isVerified = user.is_verified || user.phone_verified;
    const statusClass = isVerified ? 'verified' : 'pending';
    const statusLabel = isVerified ? 'Verified' : 'Pending';

    const lastLogin = user.updated_at
      ? new Date(user.updated_at).toLocaleDateString()
      : '—';

    return `
      <tr data-id="${user.id}">
        <td class="checkbox-col"><input type="checkbox" class="row-check"></td>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initials}</div>
            <div class="user-cell-body">
              <strong>${user.name || 'Unknown'}</strong>
              <span>${user.email || user.phone || '—'}</span>
            </div>
          </div>
        </td>
        <td><span class="tag-role ${roleClass}">${roleLabel}</span></td>
        <td>—</td>
        <td><span class="status-dot ${statusClass}">${statusLabel}</span></td>
        <td class="text-muted">${lastLogin}</td>
        <td>
          <button class="icon-btn-sm" onclick="verifyUser(${user.id})" title="Verify seller">
            <i class="fa-solid fa-check"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Update footer count
  const footer = document.querySelector('.table-footer .text-muted');
  if (footer && pagination) {
    footer.textContent = `Showing ${users.length} of ${pagination.total || users.length} entries`;
  }

  // Update top stats
  updateUserStats(users, pagination);
}

function updateUserStats(users, pagination) {
  const totalUsers = pagination?.total || users.length;
  const pending = users.filter(u => !u.is_verified && u.role === 'seller').length;

  const statValues = document.querySelectorAll('.stats-row .stat-value');
  if (statValues[0]) {
    statValues[0].innerHTML = `${totalUsers}`;
  }
  if (statValues[2]) {
    statValues[2].textContent = pending;
  }
}

async function verifyUser(id) {
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/admin/users/${id}/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await res.json();

    if (data.status) {
      showToast('User verified successfully');
      loadUsers();
    } else {
      showToast(data.message || 'Failed to verify user');
    }
  } catch (error) {
    showToast('Network error');
  }
}

/* ---------- Global Orders ---------- */
async function loadGlobalOrders() {
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please log in as Admin');
    setTimeout(() => window.location.href = '../login/login.html', 1200);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/orders`, {
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

    const orders = data.orders?.data || data.orders || [];
    renderGlobalOrders(orders, data.orders);

  } catch (error) {
    console.error(error);
    showToast('Network error');
  }
}

function renderGlobalOrders(orders, pagination = null) {
  const tbody = document.querySelector('.orders-grid .card-table tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#777;">
          No orders found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const date = order.created_at
      ? new Date(order.created_at).toLocaleString('en-GB', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';

    const buyerName = order.buyer?.name || order.user?.name || 'Unknown Buyer';

    const farmerName = order.items?.[0]?.product_name || '—';

    const amount = Number(order.total || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const payment = order.payment_method || order.payment_status || 'Pending';

    const status = (order.status || 'pending').toLowerCase();
    let statusClass = 'navy';
    if (status === 'delivered' || status === 'shipped') statusClass = 'green';
    if (status === 'cancelled') statusClass = 'red';
    if (status === 'confirmed' || status === 'processing') statusClass = 'navy';

    return `
      <tr data-id="${order.id}">
        <td class="mono">#${order.order_number || order.id}</td>
        <td class="text-muted">${date}</td>
        <td>${buyerName}</td>
        <td>${farmerName}</td>
        <td>${amount}</td>
        <td>${payment}</td>
        <td><span class="pill ${statusClass}">${status}</span></td>
      </tr>
    `;
  }).join('');

  // Update footer
  const footer = document.querySelector('.orders-grid .table-footer .text-muted');
  if (footer) {
    const total = pagination?.total || orders.length;
    footer.textContent = `Showing ${orders.length} of ${total}`;
  }
}

/* ---------- Settings Page ---------- */
function initSettingsPage() {
  if (!window.location.pathname.includes('settings')) return;

  loadAdminProfile();
  initSettingsNav();
  initChangePassword();
  initSignOut();
}

function loadAdminProfile() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    showToast('Please log in as Admin');
    setTimeout(() => window.location.href = '../login/login.html', 1200);
    return;
  }

  // Fill profile fields
  const nameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const roleInput = document.getElementById('role-title');

  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (roleInput) roleInput.value = user.role === 'admin' ? 'Platform Administrator' : user.role;

  // Avatar initials
  const avatar = document.querySelector('.profile-avatar-lg');
  if (avatar && user.name) {
    avatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const profileName = document.querySelector('.profile-head strong');
  if (profileName) profileName.textContent = user.name || 'Admin';
}

function initSettingsNav() {
  const nav = document.getElementById('settings-nav');
  if (!nav) return;

  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${btn.dataset.panel}`);
      if (panel) panel.classList.add('active');
    });
  });
}

function initChangePassword() {
  const btn = document.getElementById('change-password-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const current = document.getElementById('current-password')?.value;
    const newPass = document.getElementById('new-password')?.value;
    const confirm = document.getElementById('confirm-new-password')?.value;

    if (!current || !newPass || !confirm) {
      showToast('Please fill all password fields');
      return;
    }

    if (newPass !== confirm) {
      showToast('New passwords do not match');
      return;
    }

    if (newPass.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          current_password: current,
          password: newPass,
          password_confirmation: confirm
        })
      });

      const data = await res.json();

      if (data.status) {
        showToast('Password updated successfully');
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
      } else {
        showToast(data.message || 'Failed to update password');
      }
    } catch (error) {
      // If endpoint doesn't exist yet
      showToast('Password change endpoint not available yet');
      console.error(error);
    }
  });
}

function initSignOut() {
  // Sidebar sign out
  document.querySelectorAll('a[href="../login/login.html"]').forEach(link => {
    link.addEventListener('click', (e) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  });

  // Sign out everywhere button
  const btn = document.getElementById('signout-all-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Signed out of all sessions');
      setTimeout(() => {
        window.location.href = '../login/login.html';
      }, 1000);
    });
  }

  // Save button (demo only for now)
  const saveBtn = document.getElementById('save-settings-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showToast('Settings saved (profile loaded from your account)');
    });
  }
}