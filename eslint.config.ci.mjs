import { FlatCompat } from "@eslint/eslintrc"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

// Lighter config for CI to reduce memory usage
const eslintConfig = tseslint.config(
  // Add ignores as first item
  {
    ignores: [
      "**/generated/**", 
      "src/types/generated/**",
      "**/*.d.ts",
      "dist/**",
      ".next/**",
      "node_modules/**"
    ],
  },
  eslint.configs.recommended,
  // Use only basic TypeScript rules without type checking
  ...tseslint.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("plugin:import/recommended"),
  ...compat.extends("plugin:import/typescript"),
  {
    rules: {
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/alt-text": "off",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-no-useless-fragment": "off",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/void-dom-elements-no-children": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/array-type": "off",
      "no-case-declarations": "off",
      indent: ["error", 2, { SwitchCase: 1 }],
      "@typescript-eslint/indent": "off",
      "@next/next/no-assign-module-variable": "off",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"], "index", "object", "type"],
          pathGroups: [
            {
              pattern: "react",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "sort-imports": [
        "warn",
        {
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
        },
      ],
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/no-duplicates": "warn",
      "@typescript-eslint/consistent-type-imports": "off",
      "prefer-arrow-callback": "off",
      "arrow-body-style": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "default-case": "warn",
      "default-case-last": "error",
      "max-len": [
        "warn",
        {
          code: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
        },
      ],
    },
  },
  // Separate config for JavaScript files (AudioWorklets)
  {
    files: ["**/*.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "off",
    },
    languageOptions: {
      globals: {
        AudioWorkletProcessor: "readonly",
        registerProcessor: "readonly",
        sampleRate: "readonly",
      },
    },
  },
  // Separate config for test files - disable import sorting
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "import/order": "off",
      "sort-imports": "off",
      "import/first": "off",
      "import/newline-after-import": "off",
      "import/no-duplicates": "warn",
    },
  },
)

export default eslintConfig