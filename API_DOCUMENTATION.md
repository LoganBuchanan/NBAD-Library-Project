# Library Management API

This is the backend API for our library management system. It handles user accounts, book catalog, author information, and loan tracking.

## Setup

Make sure you have Node.js and PostgreSQL installed. Then:

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template and fill in your database details:
   ```bash
   cp .env.example .env
   ```

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Add some sample data:
   ```bash
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API runs on `http://localhost:3000` by default.

## Authentication

We use JWT tokens for authentication. After logging in, include the token in your request headers:

```
Authorization: Bearer your_jwt_token_here
```

Tokens expire after 15 minutes, so you'll need to login again periodically.

### Test Accounts

The seed script creates these accounts you can use for testing:
- **Librarian**: `librarian@library.com` / `password123`
- **Regular user**: `john@example.com` / `password123`
- **Another user**: `sarah@example.com` / `password123`

## API Reference

All API endpoints are under `/api`. Here's what's available:

### User Authentication

**Sign up**: `POST /users/signup`

Create a new account. Role defaults to "CUSTOMER" if not specified.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com", 
  "password": "securepassword",
  "role": "CUSTOMER"
}
```

**Login**: `POST /users/login`

Get your JWT token.

```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

### User Profile

**Get profile**: `GET /users/profile` (requires login)

Returns your user info.

**Update profile**: `PUT /users/profile` (requires login)

Update your name or email.

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

**Change password**: `PUT /users/change-password` (requires login)

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### User Management (Librarians Only)

**List all users**: `GET /users`

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `role`: Filter by CUSTOMER or LIBRARIAN

**Delete user**: `DELETE /users/:id`

Remove a user account. Can't delete users with active loans.

### Authors

**List authors**: `GET /authors`

Public endpoint. Query parameters:
- `page`: Page number
- `limit`: Results per page 
- `search`: Search author names

**Get author details**: `GET /authors/:id`

Shows author info plus all their books.

**Add author**: `POST /authors` (librarians only)

```json
{
  "name": "Margaret Atwood",
  "bio": "Canadian author known for dystopian fiction"
}
```

**Update author**: `PUT /authors/:id` (librarians only)

**Delete author**: `DELETE /authors/:id` (librarians only)

Can't delete authors who have books in the system.

### Books

**List books**: `GET /books`

Public endpoint. Query parameters:
- `page`: Page number
- `limit`: Results per page
- `search`: Search titles and ISBNs
- `author`: Filter by author name
- `available`: true/false for availability

**Get book details**: `GET /books/:id`

Shows book info, authors, and current loans.

**Add book**: `POST /books` (librarians only)

```json
{
  "title": "The Handmaid's Tale",
  "isbn": "9780385490818",
  "published_year": 1985,
  "available_copies": 3,
  "authorIds": ["author_id_here"]
}
```

**Update book**: `PUT /books/:id` (librarians only)

**Delete book**: `DELETE /books/:id` (librarians only)

Can't delete books that are currently loaned out.

### Loans

**Borrow book**: `POST /loans`

Regular users borrow for themselves. Librarians can specify any user.

```json
{
  "book_id": "book_id_here",
  "user_id": "user_id_here",
  "due_days": 14
}
```

`user_id` is optional for regular users. `due_days` defaults to 14.

**View loans**: `GET /loans`

Users see their own loans. Librarians see everyone's. Query parameters:
- `page`: Page number
- `limit`: Results per page
- `status`: "active" or "returned"
- `user_id`: Filter by user (librarians only)
- `overdue`: true for overdue loans only

**Get loan details**: `GET /loans/:id`

**Return book**: `PUT /loans/:id/return`

Mark a loan as returned.

**Extend loan**: `PUT /loans/:id/extend` (librarians only)

```json
{
  "extension_days": 7
}
```

**Delete loan record**: `DELETE /loans/:id` (librarians only)

For administrative cleanup.

## Permissions

### Regular Users (CUSTOMER role)
- Browse books and authors
- Manage their own profile  
- Borrow and return books
- View their loan history

### Librarians (LIBRARIAN role)
- Everything regular users can do
- Manage all users
- Add/edit/delete authors and books
- View all loans and extend due dates
- Access administrative features

## Error Responses

The API returns JSON error messages:

```json
{
  "error": "Description of what went wrong"
}
```

Common status codes:
- `400` - Invalid request data
- `401` - Not logged in
- `403` - Don't have permission  
- `404` - Resource not found
- `409` - Conflict (like duplicate email)
- `500` - Server error

## Rate Limits

To prevent spam:
- Most endpoints: 100 requests per 15 minutes per IP
- Login/signup: 5 requests per 15 minutes per IP

## Database Schema

The main entities are:

**Users**: Basic account info plus role (CUSTOMER/LIBRARIAN)

**Authors**: Name and optional biography

**Books**: Title, ISBN, publication year, copy count. Books can have multiple authors.

**Loans**: Tracks who borrowed what book when. Includes due date and return date.

## Development

Useful commands:
- `npm run dev` - Start with auto-reload
- `npm run db:studio` - Open database browser  
- `npm run db:reset` - Wipe and recreate database
- `npm run db:seed` - Add sample data

The code is organized into:
- `controllers/` - Request handlers
- `routes/` - URL routing
- `middleware/` - Authentication logic
- `prisma/` - Database schema
- `scripts/` - Database seeding

## Testing

You can test the API with any HTTP client. For example with curl:

```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"librarian@library.com","password":"password123"}'

# Get books (using token from login response)
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Or use tools like Postman, Insomnia, or VS Code's REST Client extension.