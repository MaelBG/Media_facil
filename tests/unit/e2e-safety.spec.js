import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { E2E_BASE_URL, resolveSafeE2EConfig } from "../e2e/safety.js";

describe("Proteção do destino E2E", () => {
  it("recusa destino ausente ou diferente de demo", () => {
    assert.throws(() => resolveSafeE2EConfig({ env: {} }), /informe --target demo/);
    assert.throws(() => resolveSafeE2EConfig({ target: "production", env: {} }), /informe --target demo/);
    assert.throws(() => resolveSafeE2EConfig({ target: "local-supabase", env: {} }), /informe --target demo/);
  });

  it("recusa configuração cloud ou ambiente herdados", () => {
    assert.throws(() => resolveSafeE2EConfig({ target: "demo", env: { VITE_APP_DATA_MODE: "cloud" } }), /conflita/);
    assert.throws(() => resolveSafeE2EConfig({ target: "demo", env: { VITE_APP_ENV: "production" } }), /conflita/);
    assert.throws(() => resolveSafeE2EConfig({ target: "demo", env: { VITE_SUPABASE_URL: "https://production.supabase.co" } }), /variáveis Supabase/);
    assert.throws(() => resolveSafeE2EConfig({ target: "demo", env: { SUPABASE_SERVICE_ROLE_KEY: "redacted" } }), /variáveis Supabase/);
  });

  it("recusa servidor diferente do loopback e porta reservada", () => {
    assert.throws(() => resolveSafeE2EConfig({ target: "demo", env: { E2E_BASE_URL: "https://mediafacil.app.br" } }), /servidor isolado/);
  });

  it("resolve apenas o app demo local em endereço fixo", () => {
    assert.deepEqual(resolveSafeE2EConfig({ target: "demo", env: {} }), {
      target: "demo",
      baseURL: E2E_BASE_URL,
      appMode: "demo",
      appEnvironment: "local",
    });
  });
});
