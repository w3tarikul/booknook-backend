import "dotenv/config";
import app from "./app";
import { connectDB, disconnectDB, getCollection } from "./config/db";
import { checkEnv } from "./config/env";

const port = Number(process.env.PORT) || 5001;

async function start() {
  checkEnv();
  await connectDB();
  const borrows = await getCollection("borrows");
  await borrows.createIndex({ bookId: 1, userId: 1 }, { unique: true });
  console.log("Connected to MongoDB");
  const server = app.listen(port, () => console.log(`BookNook API running on http://localhost:${port}`));
  const shutdown = () => server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
