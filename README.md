# NBAD-Library-Project

This is a digital library API utilizing Node.js, Express, Prisma, and PostgreSQL.

## Live Deployment
- [Live URL:](https://nbad-library-project.onrender.com)
- [Swagger URL:](https://nbad-library-project.onrender.com/api-docs)
- Postman Collection: Postman won't share the enviroment when sharing the collection, but I have uploaded the json files of the collection here.
- Press import in Postman at the top left, then import the collection url, followed by the enviroment url below.
- [Collection URL:](https://raw.githubusercontent.com/LoganBuchanan/NBAD-Library-Project/main/Library%20API%20Tests.postman_collection.json)
- [Enviroment URL:](https://raw.githubusercontent.com/LoganBuchanan/NBAD-Library-Project/main/Library%20API%20-%20Render.postman_environment.json)



## Team Members
- Logan Buchanan        [@LoganBuchanan](https://github.com/LoganBuchanan)
- Luka Taylor           [@ltayl106-uncc](https://github.com/ltayl106-uncc)
- Wesley Greeter        [@mayhem162](https://github.com/mayhem162/mayhem162.github.io) 
- Carson Brackenbush    [@cbrackenbush](https://github.com/cbrackenbush)

## Project Overview
This REST API powers a digital library system that enables users to browse books, borrow and return them, and manage their accounts. It supports role-based access for patrons and librarians, tracks borrowing history, and enforces borrowing limits and due dates.

## Setup Instructions

1. Install Node.js (version 16 or higher) and PostgreSQL.

2. Clone the repository:

```
git clone https://github.com/LoganBuchanan/NBAD-Library-Project.git
```

3. Navigate to the project directory:

```
cd NBAD-Library-Project
```

4. Install the required dependencies:

```
npm install
```

5. Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/DB_NAME
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
```

6. Set up the database:

```
npx prisma generate
npx prisma migrate dev
```

## Usage Details

- Testing: Use Postman to test the API. Import the collection linked above.
- Login: Register at `/api/users/register`, then log in at `/api/users/login` to get your token.
- A user(Librarian) you can use instead.
- {
-   "email": "librarian@library.com",
-   "password": "password123"
- }
- Making Requests: Add your token to request headers: `Authorization: Bearer <your-token>`.
- View Database: Check `prisma/schema.prisma` for the database structure.

7. Run the application:

```
npm start
```
