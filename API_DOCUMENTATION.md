# Library Management System API

A comprehensive library management system with user authentication and full CRUD operations.

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Seed the database:**
   ```bash
   npm run db:seed
   ```

3. **API is available at:** `http://localhost:3000`

## 🔐 Authentication

### Test Credentials
- **Librarian:** `librarian@library.com` / `password123`
- **Customer 1:** `john@example.com` / `password123`
- **Customer 2:** `sarah@example.com` / `password123`

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📋 API Endpoints

### Authentication Endpoints

#### POST /api/users/signup
Create a new user account.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "CUSTOMER" // optional, defaults to CUSTOMER
}
```

#### POST /api/users/login
Login and receive JWT token.
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Management

#### GET /api/users/profile
Get current user profile (requires authentication).

#### PUT /api/users/profile
Update current user profile (requires authentication).
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### PUT /api/users/change-password
Change user password (requires authentication).
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

#### GET /api/users
Get all users (librarians only).
Query params: `page`, `limit`, `role`

#### DELETE /api/users/:id
Delete a user (librarians only).

### Author Management

#### GET /api/authors
Get all authors (public access).
Query params: `page`, `limit`, `search`

#### GET /api/authors/:id
Get author by ID with their books (public access).

#### POST /api/authors
Create new author (librarians only).
```json
{
  "name": "Author Name",
  "bio": "Author biography"
}
```

#### PUT /api/authors/:id
Update author (librarians only).
```json
{
  "name": "Updated Name",
  "bio": "Updated bio"
}
```

#### DELETE /api/authors/:id
Delete author (librarians only).

#### GET /api/authors/admin/stats
Get author statistics (librarians only).

### Book Management

#### GET /api/books
Get all books (public access).
Query params: `page`, `limit`, `search`, `author`, `available`

#### GET /api/books/:id
Get book by ID with authors and current loans (public access).

#### POST /api/books
Create new book (librarians only).
```json
{
  "title": "Book Title",
  "isbn": "9781234567890",
  "published_year": 2023,
  "available_copies": 5,
  "authorIds": ["author-id-1", "author-id-2"]
}
```

#### PUT /api/books/:id
Update book (librarians only).
```json
{
  "title": "Updated Title",
  "available_copies": 3,
  "authorIds": ["author-id-1"]
}
```

#### DELETE /api/books/:id
Delete book (librarians only).

#### GET /api/books/admin/stats
Get book statistics (librarians only).

### Loan Management

#### POST /api/loans
Borrow a book (authenticated users).
```json
{
  "book_id": "book-id",
  "user_id": "user-id", // optional, librarians can specify any user
  "due_days": 14 // optional, defaults to 14
}
```

#### GET /api/loans
Get loans (customers see their own, librarians see all).
Query params: `page`, `limit`, `status`, `user_id`, `overdue`

#### GET /api/loans/:id
Get loan by ID (customers see their own, librarians see all).

#### PUT /api/loans/:id/return
Return a book (customers can return their own, librarians can return any).

#### PUT /api/loans/:id/extend
Extend loan due date (librarians only).
```json
{
  "extension_days": 7
}
```

#### DELETE /api/loans/:id
Delete loan record (librarians only).

#### GET /api/loans/admin/stats
Get loan statistics (librarians only).

## 🛡️ Authorization Rules

### Role-Based Access Control

**CUSTOMER Role:**
- Can view all books and authors (public endpoints)
- Can manage their own profile
- Can borrow books (create loans)
- Can return their own books
- Can view their own loans only

**LIBRARIAN Role:**
- All customer permissions
- Can manage all users (view, delete)
- Can manage authors (CRUD operations)
- Can manage books (CRUD operations)
- Can manage all loans (view all, extend, delete)
- Can view admin statistics
- Can create loans for any user

### Ownership-Based Access Control

- Users can only view/modify their own profile
- Users can only view/return their own loans
- Librarians can override ownership restrictions

## 🗄️ Database Schema

### User
- `id` (PK)
- `name`
- `email` (unique)
- `password_hash`
- `role` (CUSTOMER | LIBRARIAN)
- Relationships: One-to-many with Loan

### Author
- `id` (PK)
- `name`
- `bio` (optional)
- Relationships: Many-to-many with Book

### Book
- `id` (PK)
- `title`
- `isbn` (unique)
- `published_year`
- `available_copies`
- Relationships: Many-to-many with Author, One-to-many with Loan

### BookAuthor (Junction Table)
- `book_id` (FK)
- `author_id` (FK)
- Composite primary key

### Loan
- `id` (PK)
- `user_id` (FK)
- `book_id` (FK)
- `borrowed_at`
- `due_at`
- `returned_at` (nullable)
- Relationships: Many-to-one with User and Book

## 🔒 Security Features

- **Password Hashing:** bcrypt with salt rounds of 12
- **JWT Authentication:** Secure token-based authentication
- **Rate Limiting:** API rate limiting to prevent abuse
- **Input Validation:** Comprehensive input validation
- **CORS Protection:** Cross-origin request handling
- **Helmet Security:** Security headers
- **Role-based Authorization:** Granular access control
- **Environment Variables:** Secure configuration management

## 📝 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details if applicable"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🧪 Testing the API

You can test the API using tools like:
- **Postman** - Import the endpoints
- **curl** - Command line testing
- **Thunder Client** - VS Code extension
- **REST Client** - VS Code extension

### Sample curl commands:

```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"librarian@library.com","password":"password123"}'

# Get books (using token from login)
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer <your-jwt-token>"

# Borrow a book
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"book_id":"book-id-here"}'
```