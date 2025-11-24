// Check authentication and role
if (!authHelpers.isAuthenticated()) {
  window.location.href = '/';
}

const user = authHelpers.getUser();

// Redirect non-librarians
if (user.role !== 'LIBRARIAN') {
  window.location.href = '/dashboard.html';
}

// Display user info
document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = user.role;

let allAuthors = [];
let currentLoanFilter = 'all';

// Initialize - Load everything at once
async function initLibrarianPanel() {
  await loadOverviewStats();
  await loadAllAuthors(); // Load for book form
  await loadBooks();
  await loadAuthors();
  await loadLoans();
  await loadUsers();
}

// Removed tab management - everything loads at once now

// Load Overview Stats
async function loadOverviewStats() {
  try {
    const [bookStats, loanStats, authorStats, userData] = await Promise.all([
      fetch('/api/books/admin/stats', {
        headers: { Authorization: `Bearer ${authHelpers.getToken()}` },
      }).then((r) => r.json()),
      fetch('/api/loans/admin/stats', {
        headers: { Authorization: `Bearer ${authHelpers.getToken()}` },
      }).then((r) => r.json()),
      fetch('/api/authors/admin/stats', {
        headers: { Authorization: `Bearer ${authHelpers.getToken()}` },
      }).then((r) => r.json()),
      window.api.user.getAllUsers(1, 100),
    ]);

    document.getElementById('totalBooks').textContent =
      bookStats.totalBooks || 0;
    document.getElementById('availableBooks').textContent =
      bookStats.availableBooks || 0;
    document.getElementById('activeLoans').textContent =
      loanStats.activeLoans || 0;
    document.getElementById('overdueLoans').textContent =
      loanStats.overdueLoans || 0;
    document.getElementById('totalAuthors').textContent =
      authorStats.totalAuthors || 0;
    document.getElementById('totalUsers').textContent =
      userData.pagination.total || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// BOOKS MANAGEMENT
async function loadBooks() {
  try {
    const data = await window.api.book.getAll(1, 100);
    const container = document.getElementById('booksListContainer');

    if (data.books.length === 0) {
      container.innerHTML = '<p class="text-muted">No books found.</p>';
      return;
    }

    container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Authors</th>
                        <th>ISBN</th>
                        <th>Year</th>
                        <th>Available</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.books
                      .map(
                        (book) => `
                        <tr>
                            <td><strong>${book.title}</strong></td>
                            <td>${book.authors
                              .map((a) => a.name)
                              .join(', ')}</td>
                            <td>${book.isbn}</td>
                            <td>${book.published_year}</td>
                            <td>${book.available_copies}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick='editBook(${JSON.stringify(
                                  book
                                )})'>Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteBook('${
                                  book.id
                                }', '${book.title}')">Delete</button>
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error('Error loading books:', error);
  }
}

async function loadAllAuthors() {
  try {
    const data = await window.api.author.getAll(1, 100);
    allAuthors = data.authors;
    populateAuthorSelect();
  } catch (error) {
    console.error('Error loading authors:', error);
  }
}

function populateAuthorSelect() {
  const select = document.getElementById('bookAuthors');
  select.innerHTML = allAuthors
    .map((author) => `<option value="${author.id}">${author.name}</option>`)
    .join('');
}

function showAddBookForm() {
  document.getElementById('bookFormContainer').classList.remove('hidden');
  document.getElementById('bookFormTitle').textContent = 'Add New Book';
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
}

function hideBookForm() {
  document.getElementById('bookFormContainer').classList.add('hidden');
}

function editBook(book) {
  document.getElementById('bookFormContainer').classList.remove('hidden');
  document.getElementById('bookFormTitle').textContent = 'Edit Book';
  document.getElementById('bookId').value = book.id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookIsbn').value = book.isbn;
  document.getElementById('bookYear').value = book.published_year;
  document.getElementById('bookCopies').value = book.available_copies;

  // Select current authors
  const select = document.getElementById('bookAuthors');
  Array.from(select.options).forEach((option) => {
    option.selected = book.authors.some((a) => a.id === option.value);
  });

  // Scroll to the form
  document
    .getElementById('bookFormContainer')
    .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const bookId = document.getElementById('bookId').value;
  const selectedAuthors = Array.from(
    document.getElementById('bookAuthors').selectedOptions
  ).map((o) => o.value);

  if (selectedAuthors.length === 0) {
    alert('Please select at least one author');
    return;
  }

  const bookData = {
    title: document.getElementById('bookTitle').value,
    isbn: document.getElementById('bookIsbn').value,
    published_year: parseInt(document.getElementById('bookYear').value),
    available_copies: parseInt(document.getElementById('bookCopies').value),
    authorIds: selectedAuthors,
  };

  try {
    if (bookId) {
      await window.api.book.update(bookId, bookData);
      alert('Book updated successfully!');
    } else {
      await window.api.book.create(bookData);
      alert('Book created successfully!');
    }
    hideBookForm();
    await loadBooks();
  } catch (error) {
    alert(error.message || 'Failed to save book');
  }
});

async function deleteBook(bookId, bookTitle) {
  if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
    return;
  }

  try {
    await window.api.book.delete(bookId);
    alert('Book deleted successfully!');
    await loadBooks();
  } catch (error) {
    alert(error.message || 'Failed to delete book. It may have active loans.');
  }
}

// AUTHORS MANAGEMENT
async function loadAuthors() {
  try {
    const data = await window.api.author.getAll(1, 100);
    const container = document.getElementById('authorsListContainer');

    if (data.authors.length === 0) {
      container.innerHTML = '<p class="text-muted">No authors found.</p>';
      return;
    }

    container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Biography</th>
                        <th>Books Count</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.authors
                      .map(
                        (author) => `
                        <tr>
                            <td><strong>${author.name}</strong></td>
                            <td>${
                              author.bio
                                ? author.bio.substring(0, 100) + '...'
                                : 'N/A'
                            }</td>
                            <td>${author._count.bookAuthors}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick='editAuthor(${JSON.stringify(
                                  author
                                )})'>Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteAuthor('${
                                  author.id
                                }', '${author.name}')">Delete</button>
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error('Error loading authors:', error);
  }
}

function showAddAuthorForm() {
  document.getElementById('authorFormContainer').classList.remove('hidden');
  document.getElementById('authorFormTitle').textContent = 'Add New Author';
  document.getElementById('authorForm').reset();
  document.getElementById('authorId').value = '';
}

function hideAuthorForm() {
  document.getElementById('authorFormContainer').classList.add('hidden');
}

function editAuthor(author) {
  document.getElementById('authorFormContainer').classList.remove('hidden');
  document.getElementById('authorFormTitle').textContent = 'Edit Author';
  document.getElementById('authorId').value = author.id;
  document.getElementById('authorName').value = author.name;
  document.getElementById('authorBio').value = author.bio || '';

  // Scroll to the form
  document
    .getElementById('authorFormContainer')
    .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('authorForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const authorId = document.getElementById('authorId').value;
  const authorData = {
    name: document.getElementById('authorName').value,
    bio: document.getElementById('authorBio').value,
  };

  try {
    if (authorId) {
      await window.api.author.update(authorId, authorData);
      alert('Author updated successfully!');
    } else {
      await window.api.author.create(authorData);
      alert('Author created successfully!');
    }
    hideAuthorForm();
    await loadAuthors();
    await loadAllAuthors(); // Refresh for book form
  } catch (error) {
    alert(error.message || 'Failed to save author');
  }
});

async function deleteAuthor(authorId, authorName) {
  if (!confirm(`Are you sure you want to delete "${authorName}"?`)) {
    return;
  }

  try {
    await window.api.author.delete(authorId);
    alert('Author deleted successfully!');
    await loadAuthors();
    await loadAllAuthors();
  } catch (error) {
    alert(
      error.message ||
        'Failed to delete author. They may have associated books.'
    );
  }
}

// LOANS MANAGEMENT
async function filterLoans() {
  const selected = document.querySelector('input[name="loanFilter"]:checked');
  currentLoanFilter = selected.value;
  await loadLoans();
}

async function loadLoans() {
  try {
    let data;
    if (currentLoanFilter === 'overdue') {
      const response = await fetch(`/api/loans?overdue=true&limit=100`, {
        headers: { Authorization: `Bearer ${authHelpers.getToken()}` },
      });
      data = await response.json();
    } else {
      data = await window.api.loan.getAll(1, 100, currentLoanFilter);
    }

    const container = document.getElementById('loansListContainer');

    if (data.loans.length === 0) {
      container.innerHTML = '<p class="text-muted">No loans found.</p>';
      return;
    }

    container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Book</th>
                        <th>Borrowed</th>
                        <th>Due</th>
                        <th>Returned</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.loans
                      .map(
                        (loan) => `
                        <tr>
                            <td>${loan.user.name}</td>
                            <td><strong>${loan.book.title}</strong></td>
                            <td>${formatDate(loan.borrowed_at)}</td>
                            <td>${formatDate(loan.due_at)}</td>
                            <td>${
                              loan.returned_at
                                ? formatDate(loan.returned_at)
                                : '-'
                            }</td>
                            <td>
                                ${
                                  !loan.returned_at && loan.isOverdue
                                    ? '<span class="badge badge-danger">Overdue</span>'
                                    : ''
                                }
                                ${
                                  !loan.returned_at && !loan.isOverdue
                                    ? '<span class="badge badge-success">Active</span>'
                                    : ''
                                }
                                ${
                                  loan.returned_at
                                    ? '<span class="badge badge-secondary">Returned</span>'
                                    : ''
                                }
                            </td>
                            <td>
                                ${
                                  !loan.returned_at
                                    ? `
                                    <button class="btn btn-sm btn-success" onclick="returnLoan('${loan.id}', '${loan.book.title}')">Mark Returned</button>
                                `
                                    : ''
                                }
                                <button class="btn btn-sm btn-danger" onclick="deleteLoan('${
                                  loan.id
                                }')">Delete</button>
                            </td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        `;
  } catch (error) {
    console.error('Error loading loans:', error);
  }
}

async function returnLoan(loanId, bookTitle) {
  if (!confirm(`Mark "${bookTitle}" as returned?`)) {
    return;
  }

  try {
    await window.api.loan.returnBook(loanId);
    alert('Book marked as returned!');
    await loadLoans();
    await loadOverviewStats();
  } catch (error) {
    alert(error.message || 'Failed to return book');
  }
}

async function deleteLoan(loanId) {
  if (!confirm('Are you sure you want to delete this loan record?')) {
    return;
  }

  try {
    await window.api.loan.delete(loanId);
    alert('Loan deleted successfully!');
    await loadLoans();
  } catch (error) {
    alert(error.message || 'Failed to delete loan');
  }
}

// USERS MANAGEMENT
async function loadUsers() {
  try {
    const data = await window.api.user.getAllUsers(1, 100);
    const container = document.getElementById('usersListContainer');

    if (data.users.length === 0) {
      container.innerHTML = '<p class="text-muted">No users found.</p>';
      return;
    }

    container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Active Loans</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.users
                      .map(
                        (u) => `
                        <tr>
                            <td><strong>${u.name}</strong></td>
                            <td>${u.email}</td>
                            <td><span class="role-badge">${u.role}</span></td>
                            <td>${u._count.loans}</td>
                            <td>${formatDate(u.createdAt)}</td>
                            <td>
                                ${
                                  u.id !== user.id
                                    ? `
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}', '${u.name}')">Delete</button>
                                `
                                    : '<em>You</em>'
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
    console.error('Error loading users:', error);
  }
}

async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
    return;
  }

  try {
    await window.api.user.deleteUser(userId);
    alert('User deleted successfully!');
    await loadUsers();
  } catch (error) {
    alert(
      error.message || 'Failed to delete user. They may have active loans.'
    );
  }
}

// Helpers
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Initialize
initLibrarianPanel();
