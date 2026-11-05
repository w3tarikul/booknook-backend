import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db";
import { verifyToken } from "../middleware/auth";
import { Book } from "../types";
import { isValidId, toCopies, tooLong } from "../utils/validators";

const router = Router();

// GET /books - public list (supports ?sort=newest&limit=6&search=&category=&ownerId=)
router.get("/", async (req, res, next) => {
  try {
    const books = await getCollection<Book>("books");
    const { search, category, ownerId, limit } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { author: rx }];
    }
    if (category && category !== "all") filter.category = category;
    if (ownerId) filter.ownerId = ownerId;
    const max = Math.min(Number(limit) || 0, 100);
    let cursor = books.find(filter).sort({ createdAt: -1 });
    if (max) cursor = cursor.limit(max);
    res.json(await cursor.toArray());
  } catch (err) {
    next(err);
  }
});

// GET /books/:id - private details
router.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ message: "That book id is not valid." });
    const books = await getCollection<Book>("books");
    const book = await books.findOne({ _id: new ObjectId(id) });
    if (!book) return res.status(404).json({ message: "We could not find that book." });
    res.json(book);
  } catch (err) {
    next(err);
  }
});

// POST /books - add a book (owner comes from the token)
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { title, author, category, image, description, totalCopies } = req.body ?? {};
    const copies = toCopies(totalCopies);
    if (!title || !author || !category || !image || !description || copies === null) {
      return res.status(400).json({ message: "Please fill in every field and use between 1 and 1000 copies." });
    }
    const long = tooLong({ title, author, category, image, description });
    if (long) return res.status(400).json({ message: long });
    const doc: Book = {
      title: String(title).trim(),
      author: String(author).trim(),
      category: String(category).trim(),
      image: String(image).trim(),
      description: String(description).trim(),
      totalCopies: copies,
      availableCopies: copies,
      ownerId: req.user!.id,
      ownerName: req.user!.name,
      ownerEmail: req.user!.email,
      createdAt: new Date(),
    };
    const books = await getCollection<Book>("books");
    const result = await books.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    next(err);
  }
});

// PATCH /books/:id - owner only
router.patch("/:id", verifyToken, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ message: "That book id is not valid." });
    const books = await getCollection<Book>("books");
    const existing = await books.findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: "We could not find that book." });
    if (existing.ownerId !== req.user!.id) {
      return res.status(403).json({ message: "You can only edit books you added." });
    }
    const long = tooLong(req.body ?? {});
    if (long) return res.status(400).json({ message: long });
    const update: Partial<Book> = {};
    for (const key of ["title", "author", "category", "image", "description"] as const) {
      if (typeof req.body?.[key] === "string" && req.body[key].trim()) update[key] = req.body[key].trim();
    }
    if (req.body?.totalCopies !== undefined) {
      const copies = toCopies(req.body.totalCopies);
      if (copies === null) {
        return res.status(400).json({ message: "Total copies must be a whole number between 1 and 1000." });
      }
      const borrowed = existing.totalCopies - existing.availableCopies;
      if (copies < borrowed) {
        return res.status(400).json({ message: `${borrowed} copies are currently borrowed, so total copies cannot go below that.` });
      }
      update.totalCopies = copies;
      update.availableCopies = copies - borrowed;
    }
    await books.updateOne({ _id: existing._id }, { $set: update });
    res.json(await books.findOne({ _id: existing._id }));
  } catch (err) {
    next(err);
  }
});

// DELETE /books/:id - owner only
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!isValidId(id)) return res.status(400).json({ message: "That book id is not valid." });
    const books = await getCollection<Book>("books");
    const existing = await books.findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: "We could not find that book." });
    if (existing.ownerId !== req.user!.id) {
      return res.status(403).json({ message: "You can only delete books you added." });
    }
    await books.deleteOne({ _id: existing._id });
    const borrows = await getCollection("borrows");
    await borrows.deleteMany({ bookId: id });
    res.json({ message: "Book deleted." });
  } catch (err) {
    next(err);
  }
});

export default router;
