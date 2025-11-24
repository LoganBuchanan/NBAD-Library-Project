// Check authentication
if (!authHelpers.isAuthenticated()) {
  window.location.href = '/';
}

const user = authHelpers.getUser();

// Redirect librarians to their dashboard
if (user.role === 'LIBRARIAN') {
  window.location.href = '/librarian.html';
}

// Display user info
document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = user.role;

let currentPage = 1;
const booksPerPage = 12;

// Initialize dashboard
async function initDashboard() {
  await loadActiveLoans();
  await loadBooks(currentPage);
  await loadLoanHistory();
}

// Load active loans
async function loadActiveLoans() {
  try {
    const data = await window.api.loan.getAll(1, 100, 'active');
    const activeLoans = data.loans.filter((loan) => !loan.returned_at);

    document.getElementById('activeLoanCount').textContent = activeLoans.length;

    const container = document.getElementById('activeLoansContainer');

    if (activeLoans.length === 0) {
      container.innerHTML =
        '<p class="text-muted">You have no active loans. Browse books below to borrow!</p>';
      return;
    }

    container.innerHTML = activeLoans
      .map(
        (loan) => `
            <div class="loan-card ${loan.isOverdue ? 'overdue' : ''}">
                <div class="loan-header">
                    <h3>${loan.book.title}</h3>
                    ${
                      loan.isOverdue
                        ? '<span class="badge badge-danger">OVERDUE</span>'
                        : ''
                    }
                </div>
                <p class="text-muted">
                    ${loan.book.authors.map((a) => a.name).join(', ')}
                </p>
                <div class="loan-dates">
                    <p><strong>Borrowed:</strong> ${formatDate(
                      loan.borrowed_at
                    )}</p>
                    <p><strong>Due:</strong> ${formatDate(loan.due_at)}</p>
                </div>
                <button 
                    class="btn btn-success btn-sm" 
                    onclick="returnBook('${loan.id}', '${loan.book.title}')"
                >
                    Return Book
                </button>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading active loans:', error);
    document.getElementById('activeLoansContainer').innerHTML =
      '<p class="error-message" style="display:block;">Failed to load active loans.</p>';
  }
}

// Load available books
async function loadBooks(page = 1, search = '') {
  try {
    const data = await window.api.book.getAll(page, booksPerPage, search);

    const container = document.getElementById('booksContainer');

    if (data.books.length === 0) {
      container.innerHTML = '<p class="text-muted">No books found.</p>';
      return;
    }

    container.innerHTML = data.books
      .map(
        (book) => `
            <div class="book-card">
                <h3>${book.title}</h3>
                <p class="text-muted">${book.authors
                  .map((a) => a.name)
                  .join(', ')}</p>
                <p class="book-info">
                    <strong>ISBN:</strong> ${book.isbn}<br>
                    <strong>Year:</strong> ${book.published_year}<br>
                    <strong>Available:</strong> ${book.available_copies} copies
                </p>
                ${
                  book.available_copies > 0
                    ? `
                    <button 
                        class="btn btn-primary btn-sm" 
                        onclick="borrowBook('${book.id}', '${book.title}')"
                    >
                        Borrow
                    </button>
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
      '<p class="error-message" style="display:block;">Failed to load books.</p>';
  }
}

// Load loan history
async function loadLoanHistory() {
  try {
    const data = await window.api.loan.getAll(1, 10, 'returned');
    const returnedLoans = data.loans.filter((loan) => loan.returned_at);

    const container = document.getElementById('loanHistoryContainer');

    if (returnedLoans.length === 0) {
      container.innerHTML = '<p class="text-muted">No loan history yet.</p>';
      return;
    }

    container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Book</th>
                        <th>Borrowed</th>
                        <th>Returned</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${returnedLoans
                      .map(
                        (loan) => `
                        <tr>
                            <td><strong>${loan.book.title}</strong></td>
                            <td>${formatDate(loan.borrowed_at)}</td>
                            <td>${formatDate(loan.returned_at)}</td>
                            <td>
                                ${
                                  new Date(loan.returned_at) >
                                  new Date(loan.due_at)
                                    ? '<span class="badge badge-danger">Late</span>'
                                    : '<span class="badge badge-success">On Time</span>'
                                }
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error('Error loading loan history:', error);
    document.getElementById('loanHistoryContainer').innerHTML =
      '<p class="error-message" style="display:block;">Failed to load loan history.</p>';
  }
}

// Borrow a book
async function borrowBook(bookId, bookTitle) {
  if (!confirm(`Do you want to borrow "${bookTitle}"?`)) {
    return;
  }

  try {
    await window.api.loan.create(user.id, bookId);
    alert(`Successfully borrowed "${bookTitle}"!`);

    // Reload data
    await loadActiveLoans();
    await loadBooks(currentPage);
  } catch (error) {
    console.error('Error borrowing book:', error);
    alert(
      error.message ||
        'Failed to borrow book. You may have reached your limit (5 books) or already have this book.'
    );
  }
}

// Return a book
async function returnBook(loanId, bookTitle) {
  if (!confirm(`Do you want to return "${bookTitle}"?`)) {
    return;
  }

  try {
    await window.api.loan.returnBook(loanId);
    alert(`Successfully returned "${bookTitle}"!`);

    // Reload data
    await loadActiveLoans();
    await loadBooks(currentPage);
    await loadLoanHistory();
  } catch (error) {
    console.error('Error returning book:', error);
    alert('Failed to return book. Please try again.');
  }
}

// Search books
function searchBooks() {
  const searchTerm = document.getElementById('bookSearch').value.trim();
  currentPage = 1;
  loadBooks(currentPage, searchTerm);
}

// Clear search
function clearSearch() {
  document.getElementById('bookSearch').value = '';
  currentPage = 1;
  loadBooks(currentPage);
}

// Handle Enter key in search
document.getElementById('bookSearch')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBooks();
  }
});

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

  // Page info
  html += `<span class="page-info">Page ${pagination.currentPage} of ${pagination.pages}</span>`;

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
  const searchTerm = document.getElementById('bookSearch').value.trim();
  loadBooks(currentPage, searchTerm);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Initialize on page load
initDashboard();
