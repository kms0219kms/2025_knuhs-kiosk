import path from "node:path"
import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

import svgr from "vite-plugin-svgr"

import tailwindcss from "@tailwindcss/vite"
import htmlTerserCompression from "vite-plugin-simple-html"
import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa"

const pwaManifest: Partial<VitePWAOptions> = {
  registerType: "autoUpdate",
  includeAssets: [
    "robots.txt",
    "pwa/icons/icon-128x128.png",
    "pwa/offline.html",
  ],
  manifest: {
    name: "KNUHS NoticeBoard",
    short_name: "NoticeBoard",
    icons: [
      {
        src: "/pwa/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "apple touch icon",
      },
      {
        src: "/pwa/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/pwa/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fcfcfc",
  },
}

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
    VitePWA(pwaManifest),
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
            return id.split(".pnpm/")[1].split("/")[0]
          }

          if (id.indexOf("node_modules") > -1) {
            return id.split("node_modules/")[1].split("/")[0]
          }
        },
      },
    },
  },
})
