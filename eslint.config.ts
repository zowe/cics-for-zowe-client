import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
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
      "max-len": ["error", { code: 150 }],
      "space-in-parens": "warn",
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
