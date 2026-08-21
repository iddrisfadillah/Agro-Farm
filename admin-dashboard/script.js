// ===================== AgroMarket — Admin Portal Script =====================
// Used only by: admin-dashboard/*.html

document.addEventListener('DOMContentLoaded', () => {
  initActivityTabs();
  initModerationActions();
  initUserManagementTable();
  initRefreshButton();
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