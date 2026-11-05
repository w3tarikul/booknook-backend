import "dotenv/config";
import { connectDB } from "../src/config/db";

const cover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const books = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction", isbn: "9780743273565", copies: 3, description: "A portrait of the Jazz Age in all of its decadence and excess, told through the eyes of Nick Carraway and his mysterious neighbour." },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", isbn: "9780061120084", copies: 2, description: "A gripping, heart-wrenching story of racial injustice and childhood innocence in the American South." },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "Fiction", isbn: "9780141439518", copies: 4, description: "Elizabeth Bennet and Mr Darcy navigate manners, morality and marriage in Regency England." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy", isbn: "9780547928227", copies: 3, description: "Bilbo Baggins leaves his comfortable hobbit-hole for an unexpected adventure with thirteen dwarves and a wizard." },
  { title: "The Alchemist", author: "Paulo Coelho", category: "Self-Help", isbn: "9780062315007", copies: 2, description: "A shepherd boy follows his dream across the desert in search of treasure and discovers what truly matters." },
  { title: "Atomic Habits", author: "James Clear", category: "Self-Help", isbn: "9780735211292", copies: 5, description: "Small changes, remarkable results: a practical guide to building good habits and breaking bad ones." },
];

async function seed() {
  const db = await connectDB();
  const col = db.collection("books");
  const owner = { ownerId: "booknook-library", ownerName: "BookNook Library", ownerEmail: "hello@booknook.app" };
  let added = 0;
  for (const [i, b] of books.entries()) {
    const exists = await col.findOne({ title: b.title, ownerId: owner.ownerId });
    if (exists) continue;
    await col.insertOne({
      title: b.title,
      author: b.author,
      category: b.category,
      image: cover(b.isbn),
      description: b.description,
      totalCopies: b.copies,
      availableCopies: b.copies,
      ...owner,
      createdAt: new Date(Date.now() - (books.length - i) * 60_000),
    });
    added++;
  }
  console.log(`Seeded ${added} new book(s).`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
