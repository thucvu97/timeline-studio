import { FlatCompat } from "@eslint/eslintrc"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = tseslint.config(
  {
    ignores: ["**/*.js"], // Ignore JavaScript files from TypeScript rules
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
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
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/array-type": "off",
      // no-case-declarations
      "no-case-declarations": "off",
      // Правила для форматирования switch/case
      indent: ["error", 2, { SwitchCase: 1 }],
      "@typescript-eslint/indent": "off", // Отключаем TypeScript версию, чтобы использовать обычную
      "@next/next/no-assign-module-variable": "off",
      // Настройка правил для сортировки импортов
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
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNever: true,
        },
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-misused-promises": "off",
      // Стиль для switch statements
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
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Separate config for JavaScript files (AudioWorklets)
  {
    files: ["**/*.js"],
    rules: {
      // Basic JavaScript rules only, no TypeScript type checking
      "no-unused-vars": "warn",
      "no-undef": "off", // AudioWorkletProcessor is a global
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
    },
    languageOptions: {
      globals: {
        AudioWorkletProcessor: "readonly",
        registerProcessor: "readonly",
        sampleRate: "readonly",
      },
    },
  },
)

export default eslintConfig
