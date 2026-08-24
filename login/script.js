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

  // ===================== SIGNUP (Connected to Backend) =====================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pass = document.getElementById('signup-password').value;
    const confirm = document.getElementById('confirm-password').value;

    if (pass !== confirm) {
      showToast("Passwords don't match");
      return;
    }

    // Get selected role (convert "farmer" → "seller")
    let role = document.querySelector('#role-toggle .role-btn.active')?.dataset.role || 'buyer';
    if (role === 'farmer') role = 'seller';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('signup-email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      password: pass,
      password_confirmation: confirm,
      role: role
    };

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === true) {
        // Save phone for OTP verification
        localStorage.setItem('pending_phone', payload.phone);
        localStorage.setItem('temp_otp', data.otp); // only for testing

        showToast('Account created! Please verify OTP');
        console.log('OTP for testing:', data.otp);

         // Redirect to OTP page
          setTimeout(() => {
          window.location.href = 'verify-otp.html';
         }, 1200);

      } else {
        const firstError = Object.values(data.errors || {})[0]?.[0];
        showToast(firstError || data.message || 'Registration failed');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error. Is the backend running?');
    }
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

// ===================== VERIFY OTP =====================
const otpForm = document.getElementById('otp-form');
if (otpForm) {
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = document.getElementById('otp').value.trim();
    const phone = localStorage.getItem('pending_phone');

    if (!phone) {
      showToast('No pending registration found. Please sign up again.');
      return;
    }

    if (!otp || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          otp: otp
        })
      });

      const data = await res.json();

      if (data.status === true) {
        // Save token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('pending_phone');
        localStorage.removeItem('temp_otp');

        showToast('Phone verified successfully!');

        // Redirect based on role
        setTimeout(() => {
       if (data.user.role === 'seller') {
        window.location.href = '../farmer-dashboard/index.html';
       } else {
        window.location.href = '/index.html';
        }
       }, 1200);

      } else {
        showToast(data.message || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error. Please try again.');
    }
  });
}


}