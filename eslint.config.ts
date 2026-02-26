import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const MAX_COMPLEXITY = 15;
const MAX_LINE_LENGTH = 150;

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { globals: { ...globals.browser, ...globals.node } } 
  },
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "max-len": ["error", { code: MAX_LINE_LENGTH }],
      "space-in-parens": "warn",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { "fixStyle": "inline-type-imports" }
      ],

      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "array-callback-return": "error",
      "complexity": ["warn", MAX_COMPLEXITY],
      "constructor-super": "error",
      "getter-return": "error",
      "no-console": "warn",
      "no-const-assign": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-extra-bind": "warn",
      "no-extra-semi": "error",
      "no-implicit-globals": "error",
      "no-irregular-whitespace": "warn",
      "no-magic-numbers":["warn", { "ignore": [-1, 0, 1, 2, 4] }],
      "no-multiple-empty-lines": "warn",
      "no-return-await": "warn",
      "no-sequences": "warn",
      "no-sparse-arrays": "warn",
      "no-unreachable": "error",
      "no-unsafe-negation": "error",
      "prefer-object-spread": "warn",
      "curly": "error",
      "semi": "error",
      "object-curly-spacing": ["error", "always"],
      "comma-spacing": "error",
    }
  },
  {
    files: [
      "packages/*/__tests__/**/*.{ts,tsx}", 
      "packages/sdk/**/*.{ts,tsx}",
      "packages/vsce/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    },
  },
  {
    files: ["packages/cli/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
]);
