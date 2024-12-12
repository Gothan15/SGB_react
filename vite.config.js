import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip", // o 'brotli'
      ext: ".gz", // extensión del archivo comprimido
      threshold: 10240, // tamaño mínimo para comprimir
      deleteOriginFile: false, // mantener archivo original
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
