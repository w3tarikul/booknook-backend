# BookNook Server

REST API for **BookNook**, a small online library where readers add books, borrow them and return them.

Built with Express, TypeScript and MongoDB. Protected routes use JWT verification.

## Routes

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/books` | Public | List books (`limit`, `search`, `category`, `ownerId`), newest first |
| POST | `/books` | JWT | Add a book |
| GET | `/books/:id` | JWT | Book details |
| PATCH | `/books/:id` | JWT, owner | Edit a book |
| DELETE | `/books/:id` | JWT, owner | Delete a book |
| POST | `/borrows` | JWT | Borrow a book (decrements available copies) |
| GET | `/borrows` | JWT | The signed-in user's borrows |
| DELETE | `/borrows/:id` | JWT, borrower | Return a book (increments available copies) |

Rules enforced by the API: no borrowing when no copies are available, and no duplicate active borrow of the same book by the same user (also guarded by a unique index).

## Getting started

```bash
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm run dev            # http://localhost:5001
npm run seed           # optional sample books
```

`JWT_SECRET` must match the secret used by the BookNook client, which signs the short-lived tokens.

## Scripts

- `npm run dev` start with auto reload
- `npm run build` compile to `dist`
- `npm start` run the compiled server
- `npm run typecheck` check types
- `npm run seed` add sample books
