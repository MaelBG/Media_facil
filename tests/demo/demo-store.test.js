import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_DB_KEY, LEGACY_DEMO_DB_KEY, createDemoDatabase } from "../../src/demo/demoFixtures.js";
import { initializeDemoDatabase } from "../../src/demo/demoStore.js";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

test("initializes a fresh namespaced database without modifying the legacy key", () => {
  const storage = new MemoryStorage();
  const result = initializeDemoDatabase(storage);
  assert.deepEqual(result, { ok: true, source: "created" });
  assert.deepEqual(JSON.parse(storage.getItem(DEMO_DB_KEY)), createDemoDatabase());
  assert.equal(storage.getItem(LEGACY_DEMO_DB_KEY), null);
});

test("copies existing local data once and preserves both it and the legacy source", () => {
  const legacyDatabase = createDemoDatabase();
  legacyDatabase.perfis[1].senha = "senha-personalizada";
  const serializedLegacy = JSON.stringify(legacyDatabase);
  const storage = new MemoryStorage({ [LEGACY_DEMO_DB_KEY]: serializedLegacy });

  const result = initializeDemoDatabase(storage);
  assert.deepEqual(result, { ok: true, source: "migrated" });
  assert.equal(storage.getItem(DEMO_DB_KEY), serializedLegacy);
  assert.equal(storage.getItem(LEGACY_DEMO_DB_KEY), serializedLegacy);
  assert.equal(JSON.parse(storage.getItem(DEMO_DB_KEY)).perfis[1].senha, "senha-personalizada");
});

test("does not replace an existing namespaced database", () => {
  const existing = JSON.stringify({ preserved: true });
  const storage = new MemoryStorage({ [DEMO_DB_KEY]: existing });
  assert.deepEqual(initializeDemoDatabase(storage), { ok: true, source: "existing" });
  assert.equal(storage.getItem(DEMO_DB_KEY), existing);
});

test("preserves invalid legacy data and refuses to silently seed over it", () => {
  const invalidLegacy = "not-json";
  const storage = new MemoryStorage({ [LEGACY_DEMO_DB_KEY]: invalidLegacy });
  const result = initializeDemoDatabase(storage);
  assert.equal(result.ok, false);
  assert.equal(storage.getItem(LEGACY_DEMO_DB_KEY), invalidLegacy);
  assert.equal(storage.getItem(DEMO_DB_KEY), null);
});
