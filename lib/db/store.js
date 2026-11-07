/**
 * Repository entry point. Chooses MongoDB Atlas (production) or the local JSON
 * development store, and creates Mongo indexes once per process.
 */
import { getJsonStore, JSON_DB_FILE } from "./json.js";
import { getMongoStore } from "./mongo.js";
import { ensureIndexes } from "./indexes.js";

const driver =
  (process.env.DB_DRIVER || (process.env.MONGODB_URI ? "mongo" : "json")).toLowerCase() ===
  "mongo"
    ? "mongo"
    : "json";

const store = driver === "mongo" ? getMongoStore() : getJsonStore();

const globalCache = globalThis.__micDbReady || (globalThis.__micDbReady = {});

export const db = store;
export const DB_DRIVER = driver;
export const DB_LABEL = driver === "mongo" ? "MongoDB Atlas" : "Local JSON (development)";
export { JSON_DB_FILE };

export async function ensureDb() {
  if (globalCache.promise) return globalCache.promise;
  globalCache.promise = (async () => {
    if (driver === "mongo") await ensureIndexes(store);
    else await store.ping();
    return true;
  })().catch((error) => {
    delete globalCache.promise;
    throw error;
  });
  return globalCache.promise;
}

export async function dbHealth() {
  const started = Date.now();
  try {
    await store.ping();
    return { ok: true, driver: DB_LABEL, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      driver: DB_LABEL,
      latencyMs: Date.now() - started,
      error: error?.message || "unreachable",
    };
  }
}
