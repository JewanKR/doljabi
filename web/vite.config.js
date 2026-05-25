import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:27000",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:27000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
