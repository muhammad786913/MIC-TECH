/**
 * Local JSON storage adapter — development fallback when MONGODB_URI is absent.
 * Uses atomic writes and an in-process mutation queue. NOT for multi-instance production.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const DEFAULT_FILE = path.join(DEFAULT_DIR, "db.json");

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function getValue(doc, pathStr) {
  if (!pathStr.includes(".")) return doc?.[pathStr];
  return pathStr.split(".").reduce((current, key) => current?.[key], doc);
}

function setValue(doc, pathStr, value) {
  const parts = pathStr.split(".");
  let current = doc;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

function unsetValue(doc, pathStr) {
  const parts = pathStr.split(".");
  let current = doc;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current = current?.[parts[index]];
    if (!current) return;
  }
  delete current[parts[parts.length - 1]];
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

function valueEquals(actual, expected) {
  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return actual.some((item) => deepEqual(item, expected));
  }
  return deepEqual(actual, expected);
}

function compare(actual, expected) {
  if (actual === undefined || actual === null) return false;
  if (typeof actual === "number" && typeof expected !== "number") {
    expected = Number(expected);
  }
  return actual === expected ? 0 : actual > expected ? 1 : -1;
}

export function matchValue(actual, expected) {
  if (expected instanceof RegExp) return expected.test(String(actual ?? ""));
  if (
    expected &&
    typeof expected === "object" &&
    !Array.isArray(expected) &&
    Object.keys(expected).some((key) => key.startsWith("$"))
  ) {
    return Object.entries(expected).every(([operator, operand]) => {
      switch (operator) {
        case "$in":
          return Array.isArray(operand) && operand.some((item) => valueEquals(actual, item));
        case "$nin":
          return Array.isArray(operand) && !operand.some((item) => valueEquals(actual, item));
        case "$ne":
          return !valueEquals(actual, operand);
        case "$gt":
          return compare(actual, operand) === 1;
        case "$gte":
          return [0, 1].includes(compare(actual, operand));
        case "$lt":
          return compare(actual, operand) === -1;
        case "$lte":
          return [0, -1].includes(compare(actual, operand));
        case "$exists":
          return operand ? actual !== undefined : actual === undefined;
        case "$regex": {
          const flags = expected.$options ? String(expected.$options) : "";
          try {
            return new RegExp(String(operand), flags).test(String(actual ?? ""));
          } catch {
            return false;
          }
        }
        case "$all":
          return (
            Array.isArray(actual) &&
            Array.isArray(operand) &&
            operand.every((item) => valueEquals(actual, item))
          );
        case "$size":
          return Array.isArray(actual) && actual.length === Number(operand);
        case "$not":
          return !matchValue(actual, operand);
        case "$options":
          return true;
        default:
          return false;
      }
    });
  }
  return valueEquals(actual, expected);
}

export function matchesFilter(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, expected]) => {
    if (key === "$or") {
      return (
        Array.isArray(expected) &&
        expected.some((sub) => matchesFilter(doc, sub))
      );
    }
    if (key === "$and") {
      return Array.isArray(expected) && expected.every((sub) => matchesFilter(doc, sub));
    }
    if (key === "$nor") {
      return Array.isArray(expected) && !expected.some((sub) => matchesFilter(doc, sub));
    }
    return matchValue(getValue(doc, key), expected);
  });
}

export function applyUpdate(doc, update = {}) {
  const operators = Object.keys(update || {});
  const hasOperators = operators.some((key) => key.startsWith("$"));
  if (!hasOperators) {
    for (const [key, value] of Object.entries(update)) setValue(doc, key, clone(value));
    return doc;
  }
  for (const [operator, payload] of Object.entries(update)) {
    switch (operator) {
      case "$set":
        for (const [key, value] of Object.entries(payload || {})) setValue(doc, key, clone(value));
        break;
      case "$unset":
        for (const key of Object.keys(payload || {})) unsetValue(doc, key);
        break;
      case "$inc":
        for (const [key, value] of Object.entries(payload || {}))
          setValue(doc, key, Number(getValue(doc, key) || 0) + Number(value));
        break;
      case "$push":
        for (const [key, value] of Object.entries(payload || {})) {
          const list = getValue(doc, key);
          if (Array.isArray(list)) list.push(clone(value));
          else setValue(doc, key, [clone(value)]);
        }
        break;
      case "$addToSet":
        for (const [key, value] of Object.entries(payload || {})) {
          const list = Array.isArray(getValue(doc, key)) ? getValue(doc, key) : [];
          if (!list.some((item) => deepEqual(item, value))) list.push(clone(value));
          setValue(doc, key, list);
        }
        break;
      case "$pull":
        for (const [key, value] of Object.entries(payload || {})) {
          const list = getValue(doc, key);
          if (Array.isArray(list))
            setValue(
              doc,
              key,
              list.filter((item) => !deepEqual(item, value)),
            );
        }
        break;
      default:
        break;
    }
  }
  return doc;
}

function sortDocs(docs, sort) {
  if (!sort || !Object.keys(sort).length) return docs;
  const entries = Object.entries(sort);
  return docs.sort((a, b) => {
    for (const [key, direction] of entries) {
      const av = getValue(a, key);
      const bv = getValue(b, key);
      if (av === bv) continue;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const result = av > bv ? 1 : -1;
      return Number(direction) < 0 ? -result : result;
    }
    return 0;
  });
}

function project(doc, projection) {
  if (!projection || !Object.keys(projection).length) return doc;
  const included = Object.entries(projection).filter(([, value]) => value === 1 || value === true);
  const excluded = Object.entries(projection).filter(([, value]) => value === 0 || value === false);
  if (included.length) {
    const result = {};
    for (const [key] of included) {
      const value = getValue(doc, key);
      if (value !== undefined) setValue(result, key, clone(value));
    }
    if (projection._id !== 0 && doc._id !== undefined) result._id = doc._id;
    return result;
  }
  const result = clone(doc);
  for (const [key] of excluded) unsetValue(result, key);
  return result;
}

class JsonCollection {
  constructor(store, name) {
    this.store = store;
    this.name = name;
  }

  async find(filter = {}, options = {}) {
    const docs = await this.store.read((data) =>
      sortDocs(
        (data[this.name] || []).filter((doc) => matchesFilter(doc, filter)).map(clone),
        options.sort,
      ),
    );
    let list = docs;
    if (options.skip) list = list.slice(Number(options.skip));
    if (options.limit) list = list.slice(0, Number(options.limit));
    return list.map((doc) => project(doc, options.projection));
  }

  async findOne(filter = {}, options = {}) {
    const list = await this.find(filter, { ...options, limit: 1 });
    return list[0] || null;
  }

  async count(filter = {}) {
    return this.store.read(
      (data) => (data[this.name] || []).filter((doc) => matchesFilter(doc, filter)).length,
    );
  }

  async insertOne(doc) {
    return this.store.mutate((data) => {
      const timestamp = new Date().toISOString();
      const record = {
        _id: randomUUID(),
        ...clone(doc),
        createdAt: doc.createdAt || timestamp,
        updatedAt: doc.updatedAt || timestamp,
      };
      data[this.name] = data[this.name] || [];
      data[this.name].push(record);
      return clone(record);
    });
  }

  async insertMany(docs = []) {
    return this.store.mutate((data) => {
      data[this.name] = data[this.name] || [];
      const records = docs.map((doc) => {
        const timestamp = new Date().toISOString();
        const record = {
          _id: randomUUID(),
          ...clone(doc),
          createdAt: doc.createdAt || timestamp,
          updatedAt: doc.updatedAt || timestamp,
        };
        data[this.name].push(record);
        return clone(record);
      });
      return records;
    });
  }

  async updateOne(filter, update, options = {}) {
    return this.store.mutate((data) => {
      data[this.name] = data[this.name] || [];
      const index = data[this.name].findIndex((doc) => matchesFilter(doc, filter));
      if (index === -1) return null;
      const existing = data[this.name][index];
      const next = applyUpdate(clone(existing), update);
      next._id = existing._id;
      next.updatedAt = new Date().toISOString();
      data[this.name][index] = next;
      if (options.returnDocument === "before") return clone(existing);
      return clone(next);
    });
  }

  async deleteOne(filter) {
    return this.store.mutate((data) => {
      const list = data[this.name] || [];
      const index = list.findIndex((doc) => matchesFilter(doc, filter));
      if (index === -1) return false;
      list.splice(index, 1);
      return true;
    });
  }

  async deleteMany(filter = {}) {
    return this.store.mutate((data) => {
      const list = data[this.name] || [];
      const kept = list.filter((doc) => !matchesFilter(doc, filter));
      const removed = list.length - kept.length;
      data[this.name] = kept;
      return removed;
    });
  }

  async updateMany(filter, update) {
    return this.store.mutate((data) => {
      const list = data[this.name] || [];
      let modified = 0;
      data[this.name] = list.map((doc) => {
        if (!matchesFilter(doc, filter)) return doc;
        modified += 1;
        const next = applyUpdate(clone(doc), update);
        next._id = doc._id;
        next.updatedAt = new Date().toISOString();
        return next;
      });
      return modified;
    });
  }

  async createIndex() {
    return true;
  }

  async distinct(field, filter = {}) {
    const list = await this.find(filter, { projection: { [field]: 1 } });
    const values = new Set();
    for (const doc of list) {
      const value = getValue(doc, field);
      if (Array.isArray(value)) value.forEach((item) => values.add(item));
      else if (value !== undefined) values.add(value);
    }
    return [...values];
  }
}

class JsonStore {
  constructor(file) {
    this.file = file || DEFAULT_FILE;
    this.data = null;
    this.loading = null;
    this.queue = Promise.resolve();
  }

  async ready() {
    if (this.data) return this.data;
    if (!this.loading) {
      this.loading = (async () => {
        try {
          const raw = await fs.readFile(this.file, "utf8");
          this.data = JSON.parse(raw);
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          this.data = { meta: { createdAt: new Date().toISOString(), version: 1 } };
          await fs.mkdir(path.dirname(this.file), { recursive: true });
          await fs.writeFile(this.file, JSON.stringify(this.data, null, 2), "utf8");
        }
        return this.data;
      })().catch((error) => {
        this.loading = null;
        throw error;
      });
    }
    await this.loading;
    return this.data;
  }

  async read(fn) {
    await this.ready();
    await this.queue;
    return fn(this.data);
  }

  mutate(fn) {
    const run = this.queue.then(async () => {
      await this.ready();
      const result = fn(this.data);
      await this.persist();
      return result;
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async persist() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const temp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(this.data, null, 2), "utf8");
    await fs.rename(temp, this.file);
  }

  collection(name) {
    return new JsonCollection(this, name);
  }

  async ping() {
    await this.ready();
    return true;
  }

  async close() {
    await this.queue;
  }
}

const registry =
  globalThis.__micJsonStores || (globalThis.__micJsonStores = new Map());

export function getJsonStore(file = DEFAULT_FILE) {
  if (!registry.has(file)) registry.set(file, new JsonStore(file));
  return registry.get(file);
}

export const JSON_DB_FILE = DEFAULT_FILE;
