import "dotenv/config";
import app from "./app";
import { connectDB, getCollection } from "./config/db";

const port = Number(process.env.PORT) || 5001;

async function start() {
  await connectDB();
  const borrows = await getCollection("borrows");
  await borrows.createIndex({ bookId: 1, userId: 1 }, { unique: true });
  console.log("Connected to MongoDB");
  app.listen(port, () => console.log(`BookNook API running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
