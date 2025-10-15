import path from "node:path"
import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

import svgr from "vite-plugin-svgr"

import tailwindcss from "@tailwindcss/vite"
import htmlTerserCompression from "vite-plugin-simple-html";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    svgr(),
    tailwindcss(),
    htmlTerserCompression({ minify: true }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf(".pnpm") > -1) {
            return id.split(".pnpm/")[1].split("/")[0];
          }

          if (id.indexOf("node_modules") > -1) {
            return id.split("node_modules/")[1].split("/")[0];
          }
        },
      },
    },
  },
})
