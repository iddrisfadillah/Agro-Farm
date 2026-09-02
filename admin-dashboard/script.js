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