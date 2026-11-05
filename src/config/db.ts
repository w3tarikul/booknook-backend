import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

async function tryConnect(uri: string) {
  const c = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await c.connect();
  return c;
}

export async function connectDB(): Promise<Db> {
  if (db) return db;
  const uris = [process.env.MONGODB_URI, process.env.MONGODB_URI_FALLBACK].filter(Boolean) as string[];
  let lastErr: unknown;
  for (const uri of uris) {
    try {
      client = await tryConnect(uri);
      db = client.db(process.env.DB_NAME || "booknook");
      return db;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("MONGODB_URI is not set");
}

export async function getCollection<T extends object = any>(name: string): Promise<Collection<T>> {
  const database = await connectDB();
  return database.collection<T>(name);
}

export async function disconnectDB() {
  await client?.close();
  client = null;
  db = null;
}
