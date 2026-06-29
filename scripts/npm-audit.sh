#!/bin/bash
AUDIT_OUTPUT=$(npm audit --omit=dev --audit-level=high 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "\033[0;31mPush blocked: production dependencies have vulnerabilities.\033[0m"
  echo ""
  echo "$AUDIT_OUTPUT"
  echo ""
  echo "\033[0;33mRun 'npm audit --omit=dev' and fix before pushing.\033[0m"
  echo ""
  exit 1
fi