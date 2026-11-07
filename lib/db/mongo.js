/** MongoDB Atlas adapter (official driver). Used when MONGODB_URI is configured. */
import { MongoClient } from "mongodb";

function normalizeFilter(filter = {}) {
  const result = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof RegExp)) {
      const next = {};
      for (const [operator, operand] of Object.entries(value)) {
        if (operator === "$regex" && typeof operand === "string") {
          next.$regex = new RegExp(operand, value.$options || "");
        } else if (operator === "$options") {
          // consumed above
        } else if (operator === "$in" || operator === "$nin" || operator === "$all") {
          next[operator] = Array.isArray(operand) ? operand : [];
        } else if (operator === "$or" || operator === "$and" || operator === "$nor") {
          next[operator] = Array.isArray(operand) ? operand.map(normalizeFilter) : [];
        } else {
          next[operator] = operand;
        }
      }
      if (!next.$regex || value.$options) delete next.$options;
      result[key] = next;
    } else if (key === "$or" || key === "$and" || key === "$nor") {
      result[key] = Array.isArray(value) ? value.map(normalizeFilter) : [];
    } else {
      result[key] = value;
    }
  }
  return result;
}

const registry = globalThis.__micMongo || (globalThis.__micMongo = {});

async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  const dbName =
    process.env.MONGO_DB || process.env.MONGODB_DB || "mictech";
  const key = `${dbName}`;
  if (!registry[key]) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      retryWrites: true,
      appName: "mic-tech",
    });
    registry[key] = client
      .connect()
      .then((connected) => {
        const database = connected.db(dbName);
        return { client: connected, db: database };
      })
      .catch((error) => {
        delete registry[key];
        throw error;
      });
  }
  const connected = await registry[key];
  return connected.db;
}

class MongoCollection {
  constructor(name) {
    this.name = name;
  }

  async collection() {
    const db = await getDatabase();
    return db.collection(this.name);
  }

  async find(filter = {}, options = {}) {
    const collection = await this.collection();
    let cursor = collection.find(normalizeFilter(filter));
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(Number(options.skip));
    if (options.limit) cursor = cursor.limit(Number(options.limit));
    if (options.projection) cursor = cursor.project(options.projection);
    return cursor.toArray();
  }

  async findOne(filter = {}, options = {}) {
    const collection = await this.collection();
    return collection.findOne(normalizeFilter(filter), {
      ...(options.projection ? { projection: options.projection } : {}),
    });
  }

  async count(filter = {}) {
    const collection = await this.collection();
    return collection.countDocuments(normalizeFilter(filter));
  }

  async insertOne(doc) {
    const collection = await this.collection();
    const timestamp = new Date().toISOString();
    const record = {
      _id: doc._id || crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || timestamp,
      updatedAt: doc.updatedAt || timestamp,
    };
    await collection.insertOne(record);
    return record;
  }

  async insertMany(docs = []) {
    if (!docs.length) return [];
    const collection = await this.collection();
    const timestamp = new Date().toISOString();
    const records = docs.map((doc) => ({
      _id: doc._id || crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || timestamp,
      updatedAt: doc.updatedAt || timestamp,
    }));
    await collection.insertMany(records);
    return records;
  }

  async updateOne(filter, update, options = {}) {
    const collection = await this.collection();
    const payload = update;
    const hasOperators = Object.keys(payload).some((key) => key.startsWith("$"));
    const normalized = hasOperators ? payload : { $set: payload };
    if (normalized.$set && !normalized.$set.updatedAt) {
      normalized.$set = { ...normalized.$set, updatedAt: new Date().toISOString() };
    }
    const result = await collection.findOneAndUpdate(
      normalizeFilter(filter),
      normalized,
      {
        returnDocument: options.returnDocument === "before" ? "before" : "after",
        includeResultMetadata: false,
      },
    );
    return result || null;
  }

  async deleteOne(filter) {
    const collection = await this.collection();
    const result = await collection.deleteOne(normalizeFilter(filter));
    return result.deletedCount === 1;
  }

  async deleteMany(filter = {}) {
    const collection = await this.collection();
    const result = await collection.deleteMany(normalizeFilter(filter));
    return result.deletedCount;
  }

  async updateMany(filter, update) {
    const collection = await this.collection();
    const hasOperators = Object.keys(update || {}).some((key) => key.startsWith("$"));
    const normalized = hasOperators ? update : { $set: update };
    if (normalized.$set && !normalized.$set.updatedAt) {
      normalized.$set = { ...normalized.$set, updatedAt: new Date().toISOString() };
    }
    const result = await collection.updateMany(normalizeFilter(filter), normalized);
    return result.modifiedCount;
  }

  async distinct(field, filter = {}) {
    const collection = await this.collection();
    return collection.distinct(field, normalizeFilter(filter));
  }

  async createIndex(keys, options) {
    const collection = await this.collection();
    return collection.createIndex(keys, options);
  }
}

class MongoStore {
  collection(name) {
    return new MongoCollection(name);
  }

  async ping() {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return true;
  }

  async close() {
    await Promise.all(
      Object.values(registry).map(async (entry) => {
        try {
          const { client } = await entry;
          await client.close();
        } catch {
          /* ignore */
        }
      }),
    );
  }
}

const store = new MongoStore();

export function getMongoStore() {
  return store;
}

export { getDatabase };
