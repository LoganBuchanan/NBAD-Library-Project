// Token management
const TOKEN_KEY = 'library_token';
const USER_KEY = 'library_user';

// Save token and user info to localStorage
function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Get stored token
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Get stored user info
function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

// Clear authentication data
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getToken();
}

// Redirect based on role
function redirectToDashboard(role) {
  if (role === 'LIBRARIAN') {
    window.location.href = '/librarian.html';
  } else {
    window.location.href = '/dashboard.html';
  }
}

// Check if already logged in (for index.html)
if (
  window.location.pathname === '/' ||
  window.location.pathname === '/index.html'
) {
  if (isAuthenticated()) {
    const user = getUser();
    redirectToDashboard(user.role);
  }
}

// Login Form Handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');

  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || 'Login failed';
      errorDiv.style.display = 'block';
      return;
    }

    // Save token and user info
    saveAuth(data.token, data.user);

    // Redirect based on role
    redirectToDashboard(data.user.role);
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'An error occurred. Please try again.';
    errorDiv.style.display = 'block';
  }
});

// Signup Form Handler
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  const errorDiv = document.getElementById('signupError');

  try {
    const response = await fetch('/api/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      errorDiv.textContent = data.error || 'Signup failed';
      errorDiv.style.display = 'block';
      return;
    }

    // Save token and user info
    saveAuth(data.token, data.user);

    // Redirect based on role
    redirectToDashboard(data.user.role);
  } catch (error) {
    console.error('Signup error:', error);
    errorDiv.textContent = 'An error occurred. Please try again.';
    errorDiv.style.display = 'block';
  }
});

// Toggle between login and signup forms
document.getElementById('showSignup')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('loginError').style.display = 'none';
});

document.getElementById('showLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupError').style.display = 'none';
});

// Logout function (used on other pages)
function logout() {
  clearAuth();
  window.location.href = '/';
}

// Export functions for use in other files
window.authHelpers = {
  getToken,
  getUser,
  isAuthenticated,
  logout,
  clearAuth,
};
