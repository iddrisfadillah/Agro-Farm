// ===================== AgroMarket — Auth Pages Script =====================
// Used only by: login.html, signup.html, forgot-password.html

const API_BASE = 'http://127.0.0.1:8000/api'

document.addEventListener('DOMContentLoaded', () => {
  initPasswordReveal();
  initRoleToggle();
  initAuthForms();
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

/* ---------- Password show/hide ---------- */

function initPasswordReveal() {
  const buttons = document.querySelectorAll('[data-toggle-password]');

  buttons.forEach((btn) => {
    const targetId = btn.getAttribute('data-toggle-password');
    const input = document.getElementById(targetId);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;

    btn.addEventListener('click', () => {
      const nowShowing = input.type === 'password';
      input.type = nowShowing ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !nowShowing);
      icon.classList.toggle('fa-eye-slash', nowShowing);
      btn.setAttribute('aria-label', nowShowing ? 'Hide password' : 'Show password');
    });
  });
}

/* ---------- Sign up: buyer / farmer role toggle ---------- */

function initRoleToggle() {
  const toggle = document.getElementById('role-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.role-btn');
    if (!btn) return;
    toggle.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

/* ---------- Auth form submissions ---------- */

function initAuthForms() {
  // ===================== LOGIN (Connected to Backend) =====================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // loginForm.addEventListener('submit', (e) => {
      loginForm.addEventListener('submit', async (e) => {   // ← async is important
      e.preventDefault();
      // TODO: replace with a real authentication API call
const phoneInput = document.getElementById('phone') || document.getElementById('email');
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = document.getElementById('password')?.value || '';

      if (!phone || !password) {
        showToast('Please enter phone and password');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            phone: phone,
            password: password
          })
        });

        const data = await res.json();

        if (data.status === true) {
          // Save token
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

      showToast('Signed in successfully');
      

      // Optional: Redirect after login
          // window.location.href = 'index.html';
        } else {
          showToast(data.message || 'Invalid phone or password');
        }

      } catch (error) {
        console.error(error);
        showToast('Network error. Is the backend running?');
      }

      // const phoneInput = document.getElementById('phone') || document.getElementById('email');
      
      // console.log('Login payload:', {
      //   phone: phoneInput ? phoneInput.value : '',
      //   password: document.getElementById('password')?.value || '',
      //   remember: document.getElementById('remember')?.checked || false,
      // });
    });
  }

  // ===================== SIGNUP (Untouched) =====================
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('signup-password').value;
      const confirm = document.getElementById('confirm-password').value;
      if (pass !== confirm) {
        showToast("Passwords don't match");
        return;
      }
      const role = document.querySelector('#role-toggle .role-btn.active')?.dataset.role || 'buyer';
      // TODO: replace with a real account-creation API call
      showToast('Account created successfully');
      console.log('Signup payload:', {
        role,
        fullName: document.getElementById('full-name').value,
        email: document.getElementById('signup-email').value,
        phone: document.getElementById('phone').value,
      });
    });
  }

  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: replace with a real password-reset API call
      showToast('Reset link sent — check your inbox');
      console.log('Reset payload:', { email: document.getElementById('reset-email').value });
    });
  }
}