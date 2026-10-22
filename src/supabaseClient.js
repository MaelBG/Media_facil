import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config/appConfig.js";

export const supabase = appConfig.valid && appConfig.mode === "cloud"
  ? createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey)
  : null;
