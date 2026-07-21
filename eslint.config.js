import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Phase 10 kill-switch: block new Math.random() in gated hubs.
    // Legitimate uses (crypto seeds, jitter, tokens) must be annotated with `// synth-ok: <reason>`.
    files: [
      "src/components/analytics/**/*.{ts,tsx}",
      "src/components/create/**/*.{ts,tsx}",
      "src/components/engage/**/*.{ts,tsx}",
      "src/components/library/**/*.{ts,tsx}",
      "src/components/activity/**/*.{ts,tsx}",
      "src/components/settings/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            "Math.random() is banned in gated hubs (synth-data leak risk). If genuinely needed (jitter, crypto, tokens), append `// eslint-disable-next-line no-restricted-syntax` with a `// synth-ok:` note.",
        },
      ],
    },
  },
);
