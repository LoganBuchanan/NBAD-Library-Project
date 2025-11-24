// Base API URL
const API_BASE = '/api';

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('library_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
        window.location.href = '/';
        return;
      }

      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// User API calls
const userAPI = {
  login: (email, password) =>
    apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password, role) =>
    apiRequest('/users/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  getProfile: () => apiRequest('/users/profile'),

  updateProfile: (name, email) =>
    apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiRequest('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getAllUsers: (page = 1, limit = 10, role = null) => {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);
    return apiRequest(`/users?${params}`);
  },

  deleteUser: (userId) => apiRequest(`/users/${userId}`, { method: 'DELETE' }),
};

// Book API calls
const bookAPI = {
  getAll: (page = 1, limit = 10, search = '') => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    return apiRequest(`/books?${params}`);
  },

  getById: (bookId) => apiRequest(`/books/${bookId}`),

  create: (bookData) =>
    apiRequest('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    }),

  update: (bookId, bookData) =>
    apiRequest(`/books/${bookId}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    }),

  delete: (bookId) => apiRequest(`/books/${bookId}`, { method: 'DELETE' }),
};

// Author API calls
const authorAPI = {
  getAll: (page = 1, limit = 10) => {
    const params = new URLSearchParams({ page, limit });
    return apiRequest(`/authors?${params}`);
  },

  getById: (authorId) => apiRequest(`/authors/${authorId}`),

  create: (authorData) =>
    apiRequest('/authors', {
      method: 'POST',
      body: JSON.stringify(authorData),
    }),

  update: (authorId, authorData) =>
    apiRequest(`/authors/${authorId}`, {
      method: 'PUT',
      body: JSON.stringify(authorData),
    }),

  delete: (authorId) =>
    apiRequest(`/authors/${authorId}`, { method: 'DELETE' }),
};

// Loan API calls
const loanAPI = {
  getAll: (page = 1, limit = 10) => {
    const params = new URLSearchParams({ page, limit });
    return apiRequest(`/loans?${params}`);
  },

  getById: (loanId) => apiRequest(`/loans/${loanId}`),

  create: (userId, bookId) =>
    apiRequest('/loans', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        book_id: bookId,
      }),
    }),

  returnBook: (loanId) =>
    apiRequest(`/loans/${loanId}/return`, {
      method: 'PUT',
      body: JSON.stringify({
        returned_at: new Date().toISOString(),
      }),
    }),

  delete: (loanId) => apiRequest(`/loans/${loanId}`, { method: 'DELETE' }),
};

// Export to global scope for use in other files
window.api = {
  user: userAPI,
  book: bookAPI,
  author: authorAPI,
  loan: loanAPI,
};
