// Check if user is logged in and update nav
const isLoggedIn = authHelpers.isAuthenticated();
if (isLoggedIn) {
  const user = authHelpers.getUser();

  // Show profile link
  document.getElementById('profileLink').classList.remove('hidden');

  document.getElementById('navUserInfo').innerHTML = `
        <span class="user-name">${user.name}</span>
        <span class="role-badge">${user.role}</span>
        <button class="btn btn-secondary btn-sm" onclick="authHelpers.logout()">Logout</button>
    `;
}

let currentPage = 1;
const booksPerPage = 12;
let currentSearch = '';
let currentAvailability = 'all';

// Initialize page
async function initBooksPage() {
  await loadBooks(currentPage);
}

// Load books
async function loadBooks(page = 1) {
  try {
    // Build query parameters
    const params = {
      page,
      limit: booksPerPage,
      search: currentSearch,
    };

    // Add availability filter
    if (currentAvailability === 'available') {
      params.available = 'true';
    } else if (currentAvailability === 'unavailable') {
      params.available = 'false';
    }

    // Make API call without auth (public endpoint)
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/books?${queryString}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load books');
    }

    const container = document.getElementById('booksContainer');

    // Update book count
    document.getElementById('bookCount').textContent = data.pagination.total;

    if (data.books.length === 0) {
      container.innerHTML =
        '<p class="text-muted text-center">No books found.</p>';
      return;
    }

    // Render books
    container.innerHTML = data.books
      .map(
        (book) => `
            <div class="book-card">
                <div class="book-header">
                    <h3>${book.title}</h3>
                    ${
                      book.available_copies > 0
                        ? '<span class="badge badge-success">Available</span>'
                        : '<span class="badge badge-danger">Unavailable</span>'
                    }
                </div>
                <p class="book-authors">
                    by ${book.authors.map((a) => a.name).join(', ')}
                </p>
                <div class="book-details">
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Published:</strong> ${book.published_year}</p>
                    <p><strong>Available Copies:</strong> ${
                      book.available_copies
                    }</p>
                </div>
                ${
                  isLoggedIn && book.available_copies > 0
                    ? `
                    <button 
                        class="btn btn-primary btn-sm" 
                        onclick="borrowBook('${book.id}', '${book.title.replace(
                        /'/g,
                        "\\'"
                      )}')"
                    >
                        Borrow This Book
                    </button>
                `
                    : !isLoggedIn && book.available_copies > 0
                    ? `
                    <a href="/" class="btn btn-primary btn-sm">
                        Login to Borrow
                    </a>
                `
                    : `
                    <button class="btn btn-secondary btn-sm" disabled>
                        Not Available
                    </button>
                `
                }
            </div>
        `
      )
      .join('');

    // Update pagination
    renderPagination(data.pagination);
  } catch (error) {
    console.error('Error loading books:', error);
    document.getElementById('booksContainer').innerHTML =
      '<p class="error-message" style="display:block;">Failed to load books. Please try again.</p>';
  }
}

// Search books
function searchBooks() {
  currentSearch = document.getElementById('bookSearch').value.trim();
  currentPage = 1;
  loadBooks(currentPage);
}

// Clear search
function clearSearch() {
  currentSearch = '';
  document.getElementById('bookSearch').value = '';
  currentPage = 1;
  loadBooks(currentPage);
}

// Filter books by availability
function filterBooks() {
  const selected = document.querySelector('input[name="availability"]:checked');
  currentAvailability = selected.value;
  currentPage = 1;
  loadBooks(currentPage);
}

// Handle Enter key in search
document.getElementById('bookSearch')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBooks();
  }
});

// Borrow a book (only if logged in)
async function borrowBook(bookId, bookTitle) {
  if (!isLoggedIn) {
    alert('Please login to borrow books');
    window.location.href = '/';
    return;
  }

  if (!confirm(`Do you want to borrow "${bookTitle}"?`)) {
    return;
  }

  try {
    const user = authHelpers.getUser();
    await window.api.loan.create(user.id, bookId);
    alert(`Successfully borrowed "${bookTitle}"!`);

    // Reload books to update availability
    await loadBooks(currentPage);
  } catch (error) {
    console.error('Error borrowing book:', error);
    alert(
      error.message ||
        'Failed to borrow book. You may have reached your limit (5 books) or already have this book.'
    );
  }
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('booksPagination');

  if (pagination.pages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="pagination-buttons">';

  // Previous button
  if (pagination.currentPage > 1) {
    html += `<button class="btn btn-secondary btn-sm" onclick="changePage(${
      pagination.currentPage - 1
    })">Previous</button>`;
  }

  // Page numbers (show a few around current page)
  const startPage = Math.max(1, pagination.currentPage - 2);
  const endPage = Math.min(pagination.pages, pagination.currentPage + 2);

  if (startPage > 1) {
    html += `<button class="btn btn-secondary btn-sm" onclick="changePage(1)">1</button>`;
    if (startPage > 2) html += '<span>...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === pagination.currentPage) {
      html += `<button class="btn btn-primary btn-sm" disabled>${i}</button>`;
    } else {
      html += `<button class="btn btn-secondary btn-sm" onclick="changePage(${i})">${i}</button>`;
    }
  }

  if (endPage < pagination.pages) {
    if (endPage < pagination.pages - 1) html += '<span>...</span>';
    html += `<button class="btn btn-secondary btn-sm" onclick="changePage(${pagination.pages})">${pagination.pages}</button>`;
  }

  // Next button
  if (pagination.currentPage < pagination.pages) {
    html += `<button class="btn btn-secondary btn-sm" onclick="changePage(${
      pagination.currentPage + 1
    })">Next</button>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

// Change page
function changePage(page) {
  currentPage = page;
  loadBooks(currentPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize on page load
initBooksPage();
