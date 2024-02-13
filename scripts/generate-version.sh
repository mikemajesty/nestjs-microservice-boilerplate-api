#!/bin/bash
NODE_VERSION=$(node -p -e "require('./package.json').version")
./node_modules/generate-changelog/bin/generate -t $NODE_VERSION
git add package.json
git add package-lock.json
git add CHANGELOG.md
git commit -m "feat(release): generate version: $NODE_VERSION" -n