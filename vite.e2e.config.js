import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // E2E nunca carrega .env, .env.local ou os arquivos usados pelo app normal.
  envDir: false,
});
