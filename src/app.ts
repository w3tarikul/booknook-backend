import express from "express";
import cors from "cors";
import booksRouter from "./routes/books";
import borrowsRouter from "./routes/borrows";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());

app.use("/books", booksRouter);
app.use("/borrows", borrowsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
