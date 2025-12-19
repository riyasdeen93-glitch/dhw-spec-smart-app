const js = require("@eslint/js");
const globals = require("globals");

module.exports = {
  ...js.configs.recommended,
  plugins: ["react"],
  extends: [...(js.configs.recommended?.extends || []), "plugin:react/recommended"],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es2024: true
  },
  globals: {
    ...globals.browser
  },
  settings: {
    react: {
      version: "detect"
    }
  }
};
