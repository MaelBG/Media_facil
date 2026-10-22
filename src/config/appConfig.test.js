import test from "node:test";
import assert from "node:assert/strict";
import { resolveAppConfig } from "./appConfig.js";

const localDemo = { VITE_APP_DATA_MODE: "demo", VITE_APP_ENV: "local" };
const anonKey = `header.${btoa(JSON.stringify({ role: "anon" }))}.signature`;
const cloudBase = {
  VITE_APP_DATA_MODE: "cloud",
  VITE_SUPABASE_URL: "https://nqddatrdllvfwkmfddpc.supabase.co",
  VITE_SUPABASE_ANON_KEY: anonKey,
};

test("accepts explicit local demo without initializing cloud credentials", () => {
  const config = resolveAppConfig(localDemo, "localhost");
  assert.equal(config.valid, true);
  assert.equal(config.mode, "demo");
  assert.equal(config.supabaseUrl, null);
});

test("accepts production cloud only on the mapped production host and project", () => {
  const config = resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "production" }, "www.mediafacil.app.br");
  assert.equal(config.valid, true);
  assert.equal(config.environment, "production");
});

test("rejects missing or invalid mode instead of falling back to demo", () => {
  assert.equal(resolveAppConfig({}, "localhost").valid, false);
  assert.equal(resolveAppConfig({ ...localDemo, VITE_APP_DATA_MODE: "other" }, "localhost").valid, false);
});

test("rejects demo on production and cloud on preview", () => {
  assert.equal(resolveAppConfig({ ...localDemo, VITE_APP_ENV: "production" }, "mediafacil.app.br").valid, false);
  assert.equal(resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "preview" }, "media-facil-preview.vercel.app").valid, false);
});

test("rejects cloud credentials that are incomplete, privileged, or point at production locally", () => {
  assert.equal(resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "local" }, "localhost").valid, false);
  assert.equal(resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "local", VITE_SUPABASE_URL: "http://127.0.0.1:54321" }, "localhost").valid, true);
  assert.equal(resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "local", VITE_SUPABASE_URL: "http://127.0.0.1:54321", VITE_SUPABASE_ANON_KEY: "sb_secret_secret" }, "localhost").valid, false);
  assert.equal(resolveAppConfig({ ...cloudBase, VITE_APP_ENV: "production", VITE_SUPABASE_URL: "https://other.supabase.co" }, "www.mediafacil.app.br").valid, false);
});
