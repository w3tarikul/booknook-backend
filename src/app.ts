import express from "express";
import cors from "cors";
import booksRouter from "./routes/books";
import borrowsRouter from "./routes/borrows";
import { notFound, errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";

const app = express();

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000").split(",").map((o) => o.trim());
app.use(cors({ origin: origins, methods: ["GET", "POST", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "100kb" }));
if (process.env.NODE_ENV !== "production") app.use(requestLogger);

app.use("/books", booksRouter);
app.use("/borrows", borrowsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
