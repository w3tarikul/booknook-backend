import "dotenv/config";
import app from "../src/app";
import { getCollection } from "../src/config/db";

let ready: Promise<unknown> | null = null;

export default async function handler(req: any, res: any) {
  if (!ready) {
    ready = getCollection("borrows").then((b) => b.createIndex({ bookId: 1, userId: 1 }, { unique: true }));
  }
  await ready;
  return app(req, res);
}
