module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.includes('release')],
  rules: {
    "scope-enum": [2, "always", [
      "logging",
      "services",
      "docs",
      "dependencies",
      "profiles",
      "users",
      "api",
      "segments",
      "configuration"
    ]],
    "subject-empty": [2, "never"],
  }
};
