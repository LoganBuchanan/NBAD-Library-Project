# Library Management API

Simple REST API for managing library books, users, and loans. Built for small to medium libraries who need basic digital management.

## Getting Started

First things first - let's get this thing running:

```bash
npm run dev        # Starts the server on port 3000
npm run db:seed    # Loads some sample data
```

Your API will be live at `http://localhost:3000`

## Interactive Documentation

Check out our Swagger UI for a complete, interactive API documentation where you can test all endpoints:

🚀 **[API Documentation (Swagger UI)](http://localhost:3000/api-docs)**

The Swagger docs include:
- Complete endpoint descriptions
- Request/response examples
- Authentication setup
- Try-it-yourself functionality
- Schema definitions

## Authentication

You'll need to log in to do most things. Here are some accounts already set up for testing:

**Librarian Account:** `librarian@library.com` with password `password123`
**Regular User:** `john@example.com` with password `password123`
**Another User:** `sarah@example.com` with password `password123`

Once you log in, you'll get a token. Just stick it in your requests like this:
```
Authorization: Bearer your-token-here
```

## What You Can Do

### User Accounts

**Sign Up** - `POST /api/users/signup`
Create a new account. Pretty straightforward:
```json
{
  "name": "Your Name",
  "email": "you@email.com",
  "password": "your-password",
  "role": "CUSTOMER"
}
```
Role can be "CUSTOMER" or "LIBRARIAN" - but only existing librarians can create new librarian accounts.

**Log In** - `POST /api/users/login`
Get your access token:
```json
{
  "email": "you@email.com",
  "password": "your-password"
}
```

**Your Profile** - `GET /api/users/profile`
See your account info (login required).

**Update Profile** - `PUT /api/users/profile`
Change your name or email (login required):
```json
{
  "name": "New Name",
  "email": "newemail@example.com"
}
```

**Change Password** - `PUT /api/users/change-password`
Update your password (login required):
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

### For Librarians Only

**All Users** - `GET /api/users`
See everyone who's signed up. Add `?page=2&limit=10&role=CUSTOMER` to filter.

**Remove User** - `DELETE /api/users/:id`
Delete someone's account.

### Authors

**Browse Authors** - `GET /api/authors`
See all authors in the system. No login needed. Use `?search=tolkien` to find specific ones.

**Author Details** - `GET /api/authors/:id`
Get info about a specific author and their books.

**Add Author** - `POST /api/authors` (librarians only)
```json
{
  "name": "J.R.R. Tolkien",
  "bio": "British author and philologist..."
}
```

**Update Author** - `PUT /api/authors/:id` (librarians only)
```json
{
  "name": "Updated Name",
  "bio": "Updated bio"
}
```

**Remove Author** - `DELETE /api/authors/:id` (librarians only)

### Books

**Browse Books** - `GET /api/books`
See all books. Add filters: `?search=hobbit&author=tolkien&available=true`

**Book Details** - `GET /api/books/:id`
Get full info about a specific book.

**Add Book** - `POST /api/books` (librarians only)
```json
{
  "title": "The Hobbit",
  "isbn": "9780547928227",
  "published_year": 1937,
  "available_copies": 3,
  "authorIds": ["author-id-goes-here"]
}
```

**Update Book** - `PUT /api/books/:id` (librarians only)
```json
{
  "title": "Updated Title",
  "available_copies": 2
}
```

**Remove Book** - `DELETE /api/books/:id` (librarians only)

### Borrowing Books

**Check Out a Book** - `POST /api/loans`
Borrow a book (need to be logged in):
```json
{
  "book_id": "book-id-here",
  "due_days": 14
}
```
Librarians can add `"user_id": "someone-else"` to check out books for other people.

**My Loans** - `GET /api/loans`
See what you've borrowed. Librarians see everyone's loans.
Use filters: `?status=active&overdue=true&user_id=123`

**Loan Details** - `GET /api/loans/:id`
Get info about a specific loan.

**Return a Book** - `PUT /api/loans/:id/return`
Mark a book as returned.

**Extend Due Date** - `PUT /api/loans/:id/extend` (librarians only)
```json
{
  "extension_days": 7
}
```

**Remove Loan Record** - `DELETE /api/loans/:id` (librarians only)

## Who Can Do What

**Regular Users (CUSTOMERS):**
- Browse books and authors
- Manage their own account
- Borrow and return books
- See their own loans

**Librarians:**
- Everything customers can do
- Manage all user accounts
- Add/edit/remove books and authors
- Handle everyone's loans
- See usage stats

## How the Data Works

The database keeps track of these main things:

**Users** - People who use the system (customers and librarians)
**Authors** - Writers of books
**Books** - Items in the library collection  
**Loans** - Records of who borrowed what and when

Books can have multiple authors, and authors can write multiple books. When someone borrows a book, we create a loan record that tracks the due date and return status.

## Trying It Out

Want to test the API? Here are some quick examples:

**Log in and get a token:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"librarian@library.com","password":"password123"}'
```

**See all books:**
```bash
curl http://localhost:3000/api/books
```

**Borrow a book:**
```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"book_id":"some-book-id"}'
```

You can use Postman, Insomnia, or any HTTP client instead of curl if you prefer a graphical interface.

## When Things Go Wrong

When something goes wrong, you'll get a response like this:
```json
{
  "error": "Email and password are required"
}
```

Sometimes with extra details:
```json
{
  "error": "Validation failed",
  "details": "Password must be at least 6 characters"
}
```

Common response codes:
- `200` - Everything worked
- `201` - Created something new
- `400` - You sent bad data
- `401` - Need to log in
- `403` - Not allowed to do that
- `404` - Couldn't find it
- `409` - Already exists
- `500` - Server had a problem

## What's Under the Hood

This API uses:
- **Express.js** for the web framework
- **Prisma** for database management
- **JWT** for user authentication
- **bcrypt** for password hashing
- **Rate limiting** to prevent abuse
- **CORS** for cross-origin requests
- **Helmet** for security headers

The database schema includes proper relationships between users, books, authors, and loans, with foreign key constraints to maintain data integrity.

## Need Help?

If you're having trouble:
1. Check that the server is running on the right port
2. Make sure your JWT token isn't expired
3. Verify you're sending the right data format
4. Check the console for error messages

For development, the server logs detailed error information to help you debug issues.