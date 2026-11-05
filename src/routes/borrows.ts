import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db";
import { verifyToken } from "../middleware/auth";
import { Book, Borrow } from "../types";

const router = Router();
router.use(verifyToken);

// GET /borrows - the logged-in user's active borrows
router.get("/", async (req, res) => {
  const borrows = await getCollection<Borrow>("borrows");
  res.json(await borrows.find({ userId: req.user!.id }).sort({ borrowDate: -1 }).toArray());
});

// POST /borrows - borrow a book
router.post("/", async (req, res) => {
  const { bookId, returnDate } = req.body ?? {};
  if (!bookId || !ObjectId.isValid(String(bookId))) {
    return res.status(400).json({ message: "Please choose a valid book to borrow." });
  }
  const ret = new Date(returnDate);
  if (!returnDate || isNaN(ret.getTime()) || ret.getTime() <= Date.now()) {
    return res.status(400).json({ message: "Please pick a return date in the future." });
  }
  const books = await getCollection<Book>("books");
  const borrows = await getCollection<Borrow>("borrows");

  const duplicate = await borrows.findOne({ bookId: String(bookId), userId: req.user!.id });
  if (duplicate) {
    return res.status(409).json({ message: "You have already borrowed this book. Return it first to borrow it again." });
  }

  // Atomic decrement, only if a copy is still available
  const updated = await books.findOneAndUpdate(
    { _id: new ObjectId(String(bookId)), availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { returnDocument: "after" }
  );
  if (!updated) {
    const exists = await books.findOne({ _id: new ObjectId(String(bookId)) });
    return exists
      ? res.status(409).json({ message: "Sorry, every copy of this book is borrowed right now." })
      : res.status(404).json({ message: "We could not find that book." });
  }

  const doc: Borrow = {
    bookId: String(bookId),
    userId: req.user!.id,
    userName: req.user!.name,
    userEmail: req.user!.email,
    title: updated.title,
    image: updated.image,
    borrowDate: new Date(),
    returnDate: ret,
    status: "active",
  };
  try {
    const result = await borrows.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err: any) {
    // Unique index guard: roll the copy back
    await books.updateOne({ _id: updated._id }, { $inc: { availableCopies: 1 } });
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You have already borrowed this book. Return it first to borrow it again." });
    }
    throw err;
  }
});

// DELETE /borrows/:id - return a book
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: "That borrow id is not valid." });
  const borrows = await getCollection<Borrow>("borrows");
  const borrow = await borrows.findOne({ _id: new ObjectId(id) });
  if (!borrow) return res.status(404).json({ message: "We could not find that borrow." });
  if (borrow.userId !== req.user!.id) {
    return res.status(403).json({ message: "You can only return books you borrowed." });
  }
  await borrows.deleteOne({ _id: borrow._id });
  const books = await getCollection<Book>("books");
  await books.updateOne({ _id: new ObjectId(borrow.bookId) }, { $inc: { availableCopies: 1 } });
  res.json({ message: "Book returned. Thank you!" });
});

export default router;
