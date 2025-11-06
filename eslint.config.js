import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config({
  extends: [eslint.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/consistent-generic-constructors": ["error", "type-annotation"],
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [jsxA11y.flatConfigs.recommended],
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
    "jsx-a11y/no-autofocus": "warn", // Downgrade to warning instead of error
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  extends: [pluginReact.configs.flat.recommended],
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: true,
      document: true,
    },
  },
  plugins: {
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "warn", // Downgrade to warning
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  baseConfig,
  jsxA11yConfig,
  reactConfig,
  eslintPluginAstro.configs["flat/recommended"],
  {
    ignores: ["**/*.astro"],
  },
  eslintPluginPrettier,
  // Allow console.log in test files, e2e tests, and development utilities
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "e2e/**/*.{ts,tsx}", "**/test-utils.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
  // Allow console.log in API routes (server-side logging)
  {
    files: ["src/pages/api/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // Allow console.log in services (debugging)
  {
    files: ["src/lib/services/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Allow any in services for flexibility
    },
  },
  // Allow console.log in components (for debugging)
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-console": "warn",
    },
  },
  // Allow console.log in hooks (for debugging)
  {
    files: ["src/hooks/**/*.ts"],
    rules: {
      "no-console": "warn",
    },
  },
  // Additional overrides for specific contexts
  {
    files: ["playwright.config.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
