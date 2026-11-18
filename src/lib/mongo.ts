import "server-only";
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "commonplace";

type G = typeof globalThis & { _cpbMongo?: Promise<MongoClient> };

export const hasDb = Boolean(uri);

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  const g = globalThis as G;
  if (!g._cpbMongo) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    g._cpbMongo = client.connect().then(async (c) => {
      const db = c.db(dbName);
      await Promise.all([
        db.collection("posts").createIndex({ slug: 1 }, { unique: true }),
        db.collection("posts").createIndex({ status: 1, publishAt: -1 }),
      ]).catch(() => {});
      return c;
    });
  }
  return (await g._cpbMongo).db(dbName);
}
