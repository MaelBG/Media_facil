export const E2E_BASE_URL = "http://127.0.0.1:4178";

/** Fail closed until an isolated demo target or disposable cloud target is explicit. */
export function resolveSafeE2EConfig({ target, env = {} } = {}) {
  if (target !== "demo") {
    throw new Error("E2E bloqueado: informe --target demo. Destinos Supabase ficam indisponíveis até a subtarefa 01.9.");
  }

  if (env.VITE_APP_DATA_MODE && env.VITE_APP_DATA_MODE !== "demo") {
    throw new Error("E2E bloqueado: o modo de dados herdado conflita com o alvo demo.");
  }

  if (env.VITE_APP_ENV && env.VITE_APP_ENV !== "local") {
    throw new Error("E2E bloqueado: o ambiente herdado conflita com o alvo local demo.");
  }

  if (env.E2E_BASE_URL && env.E2E_BASE_URL !== E2E_BASE_URL) {
    throw new Error("E2E bloqueado: somente o servidor isolado em 127.0.0.1:4178 é permitido.");
  }

  const cloudVariables = Object.keys(env).filter(key =>
    (key.startsWith("VITE_SUPABASE_") || key.startsWith("SUPABASE_")) &&
    String(env[key] ?? "").trim() !== ""
  );
  if (cloudVariables.length > 0) {
    throw new Error("E2E bloqueado: remova as variáveis Supabase herdadas; o alvo demo não usa cloud.");
  }

  return Object.freeze({
    target: "demo",
    baseURL: E2E_BASE_URL,
    appMode: "demo",
    appEnvironment: "local",
  });
}

export function requireSafeE2EConfig(options) {
  try {
    return resolveSafeE2EConfig(options);
  } catch (error) {
    throw new Error(`${error.message}\nUse npm run test:e2e:demo para executar somente contra a demonstração local.`, { cause: error });
  }
}
