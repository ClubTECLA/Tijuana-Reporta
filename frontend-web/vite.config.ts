import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Prefijo "" para leer también variables sin VITE_: aquí solo se usan en este archivo, no llegan al navegador.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ["react", "react-dom"],
      // "@/..." apunta a src/ (también en vitest, que lee este archivo). Debe coincidir con paths de tsconfig.app.json.
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    // El backend no tiene CORS: en desarrollo /api se reenvía a Go quitando el prefijo, igual que nginx en producción.
    server: {
      proxy: {
        "/api": {
          target: env.DEV_API_URL || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        // Las fotos de los reportes no las sirve Go sino nginx (puerto 80 de docker compose), leyendo el volumen.
        "/multimedia": env.DEV_MULTIMEDIA_URL || "http://localhost",
      },
    },
  };
});
