.PHONY: help artillery-help artillery-setup artillery-local artillery-dev artillery-preprod artillery-prod artillery-smoke artillery-quick artillery-local-smoke artillery-dev-smoke artillery-preprod-smoke artillery-prod-smoke artillery-local-quick artillery-dev-quick artillery-preprod-quick artillery-prod-quick

# Default target
help:
	@echo "🎯 Artillery Load Testing Commands"
	@echo "=================================="
	@echo ""
	@echo "Environment Testing:"
	@echo "  make artillery-local     - Run local environment test"
	@echo "  make artillery-dev       - Run development environment test"
	@echo "  make artillery-preprod   - Run pre-production environment test"
	@echo "  make artillery-prod      - Run production environment test"
	@echo ""
	@echo "Quick Testing:"
	@echo "  make artillery-smoke     - Run smoke test (local, 10s)"
	@echo "  make artillery-quick     - Run quick test (local, 30s)"
	@echo ""
	@echo "Environment + Option Combinations:"
	@echo "  make artillery-local-smoke    - Local smoke test"
	@echo "  make artillery-dev-smoke      - Dev smoke test"
	@echo "  make artillery-preprod-smoke  - Preprod smoke test"
	@echo "  make artillery-prod-smoke     - Prod smoke test"
	@echo "  make artillery-local-quick    - Local quick test"
	@echo "  make artillery-dev-quick      - Dev quick test"
	@echo "  make artillery-preprod-quick  - Preprod quick test"
	@echo "  make artillery-prod-quick     - Prod quick test"
	@echo ""
	@echo "Utility:"
	@echo "  make artillery-help      - Show Artillery script help"
	@echo "  make artillery-setup     - Verify Artillery setup"
	@echo ""
	@echo "📚 Documentation: .artillery/README.md"

# Show Artillery script help
artillery-help:
	@./.artillery/run-artillery.sh --help

# Verify Artillery setup
artillery-setup:
	@echo "🔍 Verifying Artillery setup..."
	@command -v npx >/dev/null 2>&1 || { echo "❌ npx not found. Install Node.js"; exit 1; }
	@npx artillery --version >/dev/null 2>&1 || { echo "❌ Artillery not available. Run: npm install -g artillery"; exit 1; }
	@[ -f .env ] || { echo "❌ .env file not found"; exit 1; }
	@grep -q "ARTILLERY_TARGET" .env || { echo "❌ ARTILLERY_TARGET not found in .env"; exit 1; }
	@grep -q "ARTILLERY_TEST_EMAIL" .env || { echo "❌ ARTILLERY_TEST_EMAIL not found in .env"; exit 1; }
	@grep -q "ARTILLERY_TEST_PASSWORD" .env || { echo "❌ ARTILLERY_TEST_PASSWORD not found in .env"; exit 1; }
	@echo "✅ Artillery setup verified"

# Environment-specific targets
artillery-local:
	@./.artillery/run-artillery.sh local

artillery-dev:
	@./.artillery/run-artillery.sh dev

artillery-preprod:
	@./.artillery/run-artillery.sh preprod

artillery-prod:
	@./.artillery/run-artillery.sh prod

# Quick options (default to local)
artillery-smoke:
	@./.artillery/run-artillery.sh local --smoke

artillery-quick:
	@./.artillery/run-artillery.sh local --quick

# Environment + Option combinations
artillery-local-smoke:
	@./.artillery/run-artillery.sh local --smoke

artillery-dev-smoke:
	@./.artillery/run-artillery.sh dev --smoke

artillery-preprod-smoke:
	@./.artillery/run-artillery.sh preprod --smoke

artillery-prod-smoke:
	@./.artillery/run-artillery.sh prod --smoke

artillery-local-quick:
	@./.artillery/run-artillery.sh local --quick

artillery-dev-quick:
	@./.artillery/run-artillery.sh dev --quick

artillery-preprod-quick:
	@./.artillery/run-artillery.sh preprod --quick

artillery-prod-quick:
	@./.artillery/run-artillery.sh prod --quick