const eslint = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
  {
    // Base recommended configs
    ...eslint.configs.recommended,
  },
  {
    // Ignore patterns
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "web-build/**",
      "*.min.js",
      "eslint.config.js",
      "babel.config.js",
      "metro.config.js",
      "App.js",
    ],
  },
  {
    // Node/CommonJS environment for config files, plugins, shims, mocks, and
    // jest setup — these use require/module/global/__dirname which are Node globals.
    files: [
      "*.config.js",
      "plugins/**/*.js",
      "shims/**/*.js",
      "__mocks__/**/*.js",
      "jest.setup.js",
    ],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "writable",
        __dirname: "readonly",
        __filename: "readonly",
        global: "writable",
        process: "readonly",
        exports: "writable",
        jest: "readonly",
      },
    },
  },
  {
    // Node/ESM globals for .mjs scripts (fetch, console, process are available
    // in Node 18+ via global scope or via --experimental-fetch / built-in)
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
        AbortSignal: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // TypeScript and React config
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Turn off base ESLint rules that TS handles
      "no-unused-vars": "off",
      "no-undef": "off",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // React rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Native specific
      "react/no-unescaped-entities": "off",
    },
  },
];
