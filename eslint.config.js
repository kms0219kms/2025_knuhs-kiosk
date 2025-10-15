import globals from "globals"

import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"

import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

import tseslint from "typescript-eslint"
import eslintPluginPrettier from "eslint-plugin-prettier/recommended"

import pluginRouter from "@tanstack/eslint-plugin-router"
import pluginQuery from "@tanstack/eslint-plugin-query"

export default defineConfig([
  globalIgnores(["dist"]),

  {
    files: ["**/*.{ts,tsx}"],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,

      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],

    rules: {
      "react-refresh/only-export-components": "warn",
    },

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  eslintPluginPrettier,
  pluginRouter.configs["flat/recommended"],
  pluginQuery.configs["flat/recommended"],
])
