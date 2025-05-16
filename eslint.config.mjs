import unjs from "eslint-config-unjs";

// https://github.com/unjs/eslint-config
export default unjs({
  ignores: ["test/.tmp"],
  rules: {
  "unicorn/prefer-module": 0
},
});
