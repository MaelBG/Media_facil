const PRODUCTION_HOSTS = new Set(["mediafacil.app.br", "www.mediafacil.app.br"]);
const PRODUCTION_SUPABASE_HOST = "nqddatrdllvfwkmfddpc.supabase.co";
const LOCAL_SUPABASE_HOSTS = new Set(["localhost", "127.0.0.1"]);

function failure(message, environment = "unknown") {
  return {
    valid: false,
    mode: null,
    environment,
    error: message,
    supabaseUrl: null,
    supabaseAnonKey: null,
  };
}

function classifyHost(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  if (PRODUCTION_HOSTS.has(normalized)) return "production";
  if (LOCAL_SUPABASE_HOSTS.has(normalized)) return "local";
  if (normalized.endsWith(".vercel.app")) return "preview";
  return "unknown";
}

function isPublicSupabaseKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || typeof atob !== "function") return false;

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const role = JSON.parse(atob(payload)).role;
    return role === "anon";
  } catch {
    return false;
  }
}

/** Pure resolver so mode and destination rules can be checked without a browser. */
export function resolveAppConfig(env = {}, hostname = "") {
  const environment = classifyHost(hostname);
  const mode = String(env.VITE_APP_DATA_MODE || "").trim().toLowerCase();
  const declaredEnvironment = String(env.VITE_APP_ENV || "").trim().toLowerCase();

  if (environment === "unknown") {
    return failure("A origem deste aplicativo não está reconhecida.");
  }

  if (!new Set(["demo", "cloud"]).has(mode)) {
    return failure("Defina VITE_APP_DATA_MODE como 'demo' ou 'cloud'.", environment);
  }

  if (declaredEnvironment !== environment) {
    return failure(`VITE_APP_ENV deve ser '${environment}' para esta origem.`, environment);
  }

  if (environment === "production" && mode !== "cloud") {
    return failure("O domínio de produção exige o modo cloud.", environment);
  }

  if (mode === "demo") {
    return {
      valid: true,
      mode,
      environment,
      error: null,
      supabaseUrl: null,
      supabaseAnonKey: null,
    };
  }

  const rawUrl = String(env.VITE_SUPABASE_URL || "").trim();
  const anonKey = String(env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!rawUrl || !anonKey || rawUrl === "https://seu-projeto.supabase.co" || anonKey === "sua-chave-anon-publica-aqui") {
    return failure("Modo cloud exige VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY válidas.", environment);
  }

  if (!isPublicSupabaseKey(anonKey)) {
    return failure("A chave configurada não foi reconhecida como chave pública anon/publishable.", environment);
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return failure("VITE_SUPABASE_URL não é uma URL válida.", environment);
  }

  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    return failure("VITE_SUPABASE_URL deve conter somente a origem do projeto.", environment);
  }

  if (environment === "local") {
    if (url.protocol !== "http:" || !LOCAL_SUPABASE_HOSTS.has(url.hostname) || url.port !== "54321") {
      return failure("Em origem local, cloud só pode usar o Supabase local em localhost:54321.", environment);
    }
  } else if (environment === "production") {
    if (url.protocol !== "https:" || url.hostname !== PRODUCTION_SUPABASE_HOST || url.port) {
      return failure("A origem de produção não está autorizada a usar esse projeto Supabase.", environment);
    }
  } else {
    return failure("Cloud está bloqueado em Preview até existir um projeto de homologação isolado.", environment);
  }

  return {
    valid: true,
    mode,
    environment,
    error: null,
    supabaseUrl: url.origin,
    supabaseAnonKey: anonKey,
  };
}

const viteEnv = import.meta.env || {};
const hostname = typeof window === "undefined" ? "" : window.location.hostname;

export const appConfig = resolveAppConfig(viteEnv, hostname);
