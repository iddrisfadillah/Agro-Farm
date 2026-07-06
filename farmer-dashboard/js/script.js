// ===================== AgroMarket Portal — Shared Interactions =====================

document.addEventListener('DOMContentLoaded', () => {
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

/* ---------- Product media upload ---------- */

function initUploadBox() {
  const box = document.getElementById('upload-box');
  const fileInput = document.getElementById('file-input');
  const grid = document.getElementById('thumb-grid');
  if (!box || !fileInput || !grid) return;

  box.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(addThumb);
    fileInput.value = '';
  });

  ['dragover', 'dragenter'].forEach(evt =>
    box.addEventListener(evt, (e) => { e.preventDefault(); box.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach(evt =>
    box.addEventListener(evt, (e) => { e.preventDefault(); box.classList.remove('dragover'); })
  );
  box.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(addThumb);
  });

  function addThumb(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const slot = document.createElement('div');
      slot.className = 'thumb-slot';
      slot.style.backgroundImage = `url('${e.target.result}')`;
      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.type = 'button';
      remove.textContent = '×';
      remove.addEventListener('click', () => slot.remove());
      slot.appendChild(remove);
      grid.appendChild(slot);
    };
    reader.readAsDataURL(file);
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

/* ---------- Form submit / save draft ---------- */

function initFormSubmit() {
  const form = document.getElementById('listing-form');
  const draftBtn = document.getElementById('save-draft-btn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // TODO: replace with real API call once the database is connected,
    // e.g. fetch('/api/listings', { method: 'POST', body: collectFormData() })
    showToast('Listing published successfully');
    console.log('Publish listing payload:', collectFormData());
  });

  draftBtn.addEventListener('click', () => {
    // TODO: replace with real API call to save a draft
    showToast('Draft saved');
    console.log('Draft payload:', collectFormData());
  });

  function validateForm() {
    const name = document.getElementById('product-name');
    if (!name.value.trim()) {
      name.focus();
      showToast('Please enter a product name');
      return false;
    }
    return true;
  }

  function collectFormData() {
    const tags = Array.from(document.querySelectorAll('#tag-box .tag-chip'))
      .map(chip => chip.firstChild.textContent.trim());

    return {
      productName: document.getElementById('product-name').value,
      category: document.getElementById('category').value,
      farm: document.getElementById('farm').value,
      tags,
      price: document.getElementById('price').value,
      unitType: document.getElementById('unit-type').value,
      stock: document.getElementById('stock').value,
      harvestDate: document.getElementById('harvest-date').value,
      shelfLife: document.getElementById('shelf-life').value,
      description: document.getElementById('description').value,
    };
  }
}