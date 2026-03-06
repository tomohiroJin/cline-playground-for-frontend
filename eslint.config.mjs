import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
    ],
    plugins: {
      "react-hooks": reactHooks,
      security,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "react/prop-types": "off",
      // react-hooks: 元の recommended と同等のルールのみ有効化
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // セキュリティルール
      // detect-object-injection は配列インデックスアクセス等で誤検知が多いため無効化
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "warn",
    },
  },
]);
