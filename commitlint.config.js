module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.includes('release')],
  rules: {
    "scope-empty": [2, "never"],
    "scope-enum": [2, "never", [
      "logging",
      "services",
      "docs",
      "dependencies",
      "profiles",
      "users",
      "api",
      "segments",
      "configuration"
    ]]
  }
};
