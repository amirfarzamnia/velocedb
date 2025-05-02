import eslint from "@eslint/js";
import eslintPluginStylisticTS from "@stylistic/eslint-plugin-ts";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@stylistic/ts": eslintPluginStylisticTS,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "off",
      curly: "warn",
      "@stylistic/ts/padding-line-between-statements": [
        "warn",
        {
          blankLine: "always",
          next: "*",
          prev: "*",
        },
        {
          blankLine: "any",
          next: "import",
          prev: "import",
        },
      ],
    },
    settings: {
      environment: {
        node: true,
        es6: true,
      },
    },
  }
);
