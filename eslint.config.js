import globals from "globals";
import tseslint from "typescript-eslint";
import pluginJest from "eslint-plugin-jest";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/", "build/", "front/"],
  },

  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },

  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    ...pluginJest.configs["flat/recommended"],
  },

  prettierConfig,
];
