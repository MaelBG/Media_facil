import {
  createDemoDatabase,
  DEMO_DB_KEY,
  LEGACY_DEMO_DB_KEY,
  demoDatabaseHasValidShape,
} from "./demoFixtures.js";

/** Initializes only the demo namespace. Legacy data is copied, never deleted or reset. */
export function initializeDemoDatabase(storage) {
  try {
    if (storage.getItem(DEMO_DB_KEY) !== null) {
      return { ok: true, source: "existing" };
    }

    const legacyValue = storage.getItem(LEGACY_DEMO_DB_KEY);
    if (legacyValue !== null) {
      let legacyDatabase;
      try {
        legacyDatabase = JSON.parse(legacyValue);
      } catch {
        return { ok: false, source: "legacy", error: "A base local anterior está inválida e foi preservada sem alterações." };
      }

      if (!demoDatabaseHasValidShape(legacyDatabase)) {
        return { ok: false, source: "legacy", error: "A base local anterior não tem um formato reconhecido e foi preservada sem alterações." };
      }

      storage.setItem(DEMO_DB_KEY, legacyValue);
      return { ok: true, source: "migrated" };
    }

    storage.setItem(DEMO_DB_KEY, JSON.stringify(createDemoDatabase()));
    return { ok: true, source: "created" };
  } catch {
    return { ok: false, source: "storage", error: "Não foi possível inicializar o armazenamento local da demonstração." };
  }
}
