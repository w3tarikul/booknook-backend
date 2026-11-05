# BookNook Server

REST API for **BookNook**, a small online library where readers add books, borrow them for a few days and return them.

- Client repo: [booknook-frontend](https://github.com/w3tarikul/booknook-frontend)
- Live API: _added after deployment_

## Tech stack

Express 5, TypeScript, MongoDB (native driver), JSON Web Tokens, deployed on Vercel.

## How authentication works

The client signs users in with Better Auth. This server never sees passwords or sessions. It only trusts a JWT:

1. A signed-in user asks the client for a token (`/api/token`). The client checks the Better Auth session and signs a JWT (HS256, 1 hour expiry) holding the user's id, name and email.
2. The client sends it as `Authorization: Bearer <token>`.
3. `verifyToken` middleware checks the signature and expiry with the shared `JWT_SECRET`. Missing, invalid or expired tokens get `401`.
4. The user is read from the verified token, never from the request body. Owners can only edit or delete their own books (`403` otherwise), and borrowers can only return their own borrows.

`JWT_SECRET` must be the same value on the client and the server.

## API routes

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/books` | Public | List books, newest first. Query: `limit`, `search`, `category`, `ownerId` |
| POST | `/books` | JWT | Add a book |
| GET | `/books/:id` | JWT | Book details |
| PATCH | `/books/:id` | JWT, owner | Edit a book |
| DELETE | `/books/:id` | JWT, owner | Delete a book and its borrows |
| POST | `/borrows` | JWT | Borrow a book: `{ bookId, returnDate }` |
| GET | `/borrows` | JWT | The signed-in user's active borrows |
| DELETE | `/borrows/:id` | JWT, borrower | Return a book |

### Borrowing rules

- Borrowing decrements `availableCopies` atomically and only while copies remain, so two people cannot take the last copy.
- Returning a book increments `availableCopies`.
- A user cannot hold the same book twice. This is checked in code and enforced by a unique index on `{ bookId, userId }`.
- The return date must be in the future.
- Total copies cannot be lowered below the number currently borrowed.

### Data model

`books`: `title, author, category, image, description, totalCopies, availableCopies, ownerId, ownerName, ownerEmail, createdAt`

`borrows`: `bookId, userId, userName, userEmail, title, image, borrowDate, returnDate, status`

Input is validated for required fields, field length limits and copy counts. Errors return `{ "message": "..." }` with a suitable status code.

## Getting started

```bash
npm install
cp .env.example .env    # then fill in the values
npm run dev             # http://localhost:5001
npm run seed            # optional: add sample books
```

### Environment variables

| Name | Description |
| --- | --- |
| `PORT` | Port to listen on (default `5001`) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_URI_FALLBACK` | Optional non-SRV string, tried if the first fails |
| `DB_NAME` | Database name (default `booknook`) |
| `JWT_SECRET` | Shared secret used to verify tokens |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma separated |

## Scripts

- `npm run dev` start with auto reload
- `npm run build` compile to `dist`
- `npm start` run the compiled server
- `npm run typecheck` check types
- `npm run seed` add sample books

## Project structure

```
src/
  config/       database connection and env check
  middleware/   JWT verification, logger, error handlers
  routes/       books and borrows routers
  utils/        validation helpers
  types/        shared types
api/            Vercel serverless entry
scripts/        seed script
```
