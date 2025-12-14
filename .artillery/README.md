# 🎯 Artillery Load Testing System

**Production-ready load testing framework** with visual reporting, automated documentation, and enterprise-grade configuration management.

> ⚡ **High-performance testing** • 🔒 **Secure credential management** • 📊 **Visual dashboards** • 📝 **Auto-generated reports**

## 📚 Documentation

- **Artillery Official Docs**: https://artillery.io/docs
- **Load Testing Guide**: https://artillery.io/docs/get-started/load-testing-guide
- **Configuration Reference**: https://artillery.io/docs/reference

## 🏗️ System Architecture

### ✨ Key Features

- **🎨 Visual Terminal Output**: Colorized reports with ASCII tables and animated progress bars
- **🏥 Health Check Automation**: MongoDB & CPU monitoring with real-time metrics tracking
- **📊 Smart Results Parsing**: Automated extraction of key metrics with success rate calculations
- **📝 Auto-Generated Documentation**: Professional OUTPUT.md reports with complete test details
- **⏱️ Coordinated Timeout Strategy**: Artillery & app timeout alignment preventing cascade failures
- **🚀 Database Optimization**: 16 PostgreSQL performance indexes for high-scale testing
- **🔄 Template-Based Config**: Dynamic environment substitution with `envsubst`
- **🔒 Secure Credential Management**: Externalized secrets via `.env` variables
- **🎯 Realistic User Flows**: Dynamic login simulation with environment-aware testing
- **⚡ Multi-Environment Support**: Local, dev, preprod, and production configurations
- **🛡️ Production-Ready**: Comprehensive error handling and validation

### 📁 System Structure

```
.artillery/
├── 📄 template.yaml        # Artillery config template with ${VARIABLE} placeholders
├── 📄 output.yaml          # Generated runtime config (auto-created, gitignored)
├── 📄 OUTPUT.md            # Auto-generated test reports with full results
├── 🚀 run-artillery.sh     # Main orchestration script with visual output
├── 📄 user-flow.mjs        # Advanced user flow processor with session management
├── 📄 README.md            # This documentation file
└── 📁 config/              # Environment-specific configuration modules
    ├── 🏠 local.mjs        # Local development testing (light load)
    ├── 🔧 dev.mjs          # Development environment (medium load)
    ├── 🚧 preprod.mjs      # Pre-production stress testing (heavy load)
    └── 🏭 prod.mjs         # Production high-scale testing (extreme load)
```

## 🚀 Quick Start Guide

### 📋 Prerequisites

1. **Environment Configuration** - Create/update root `.env` file:
   ```env
   ARTILLERY_TARGET=http://localhost:5000
   ARTILLERY_ENV=local
   ARTILLERY_TEST_EMAIL=test@example.com
   ARTILLERY_TEST_PASSWORD=password123
   ```

2. **Artillery Installation**:
   ```bash
   npm install -g artillery@latest
   ```

3. **System Dependencies**:
   ```bash
   # macOS
   brew install gettext  # for envsubst

   # Ubuntu/Debian
   sudo apt-get install gettext-base
   ```

### 🎯 Running Tests

**Environment-Specific Tests:**
```bash
make artillery-local      # Local development (4min, ~1.8K users)
make artillery-dev        # Development env (9min, ~8.4K users)
make artillery-preprod    # Pre-production (12min, ~15.3K users)
make artillery-prod       # Production scale (20min, ~82.5K users)
```

**Quick Testing Options:**
```bash
make artillery-smoke      # Smoke test (10s, ~10 users)
make artillery-quick      # Quick test (30s, ~300 users)
```

**Environment-Specific Quick Tests:**
```bash
make artillery-local-smoke     # Local smoke test
make artillery-dev-quick       # Dev quick test
make artillery-preprod-smoke   # Preprod smoke test
make artillery-prod-quick      # Production quick test
```

**Help & Documentation:**
```bash
make artillery-help       # Artillery system help
make artillery-setup      # Verify system configuration
make help                 # Show all available commands
```

### 📊 Test Output Features

**� System Health Monitoring:**
- MongoDB WiredTiger cache memory tracking (real values under load)
- CPU load calculation with functional programming patterns
- Real-time system metrics during test execution
- Automated health check validation per phase

**🎨 Visual Terminal Output:**
- Colorized ASCII tables with performance metrics
- **Animated progress bars** for each test phase with user count display
- Real-time progress indicators during test execution
- Clear success/failure status with visual indicators

**⏱️ Smart Timeout Coordination:**
- Artillery: 7s (local) / 8s (production) timeout configuration
- Application: 6s coordinated timeout (TIMEOUT=5000 + 1000ms server)
- Prevents timeout cascade failures and false negatives
- **Timeout simulation system** for edge case testing

**📝 Automated Documentation:**
- Professional OUTPUT.md generated after each test
- Complete test configuration details
- Performance summary tables
- Full Artillery output preservation (filtered for readability)

**🔍 Key Metrics Displayed:**
- Total requests and response codes breakdown
- Success rate percentage calculation
- Response time analysis (min/max/average)
- Test duration and user simulation details
- Phase-by-phase execution progress

## ⚙️ Advanced Configuration

### 🎛️ Environment Configuration Files

Each environment in `config/*.mjs` follows this structure:

```javascript
export default {
  target: process.env.ARTILLERY_TARGET,
  phases: [
    { duration: 60, arrivalRate: 5 },     // 🔼 Ramp-up phase
    { duration: 120, arrivalRate: 10 },   // 🔥 Peak load phase  
    { duration: 60, arrivalRate: 5 }      // 🔽 Cool-down phase
  ],
  thinkTime: 2,
  scenarioName: 'Load Test - Local Environment',
  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
```

### 🌍 Environment-Specific Load Profiles

| Environment | Duration | Users Created | Peak Load | Use Case |
|-------------|----------|---------------|-----------|----------|
| **🏠 Local** | 12 minutes | ~34,500 | 75 users/s | **HIGH STRESS** - Near-limit testing |
| **🔧 Dev** | 9 minutes | ~8,400 | 20 users/s | Integration validation |
| **🚧 Preprod** | 12 minutes | ~15,300 | 30 users/s | Pre-release stress testing |
| **🏭 Prod** | 20 minutes | ~82,500 | 100 users/s | Production capacity planning |

### ⏱️ Timeout Configuration

**Coordinated Timeout Strategy** - Artillery timeouts are aligned with application settings for optimal testing:

```javascript
// .artillery/config/local.mjs
export default {
  target: process.env.ARTILLERY_TARGET,
  
  // ⏱️ Timeout settings (aligned with app TIMEOUT=5000 + server +1000ms = 6s total)
  http: {
    timeout: 7000,         // 7s - App uses 6s, Artillery has 1s margin
    connectTimeout: 3000,  // 3s - Connection establishment limit
    requestTimeout: 7000   // 7s - Total request timeout
  },
  
  phases: [
    { duration: 120, arrivalRate: 25 },  // 🔼 Warm-up: ~3,000 users
    { duration: 300, arrivalRate: 50 },  // 🔥 Peak: ~15,000 users  
    { duration: 180, arrivalRate: 75 },  // 🚨 Stress: ~13,500 users
    { duration: 120, arrivalRate: 25 }   // 🔽 Cool-down: ~3,000 users
  ],
  thinkTime: 1,
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test - HIGH LOAD`
};
```

**Environment-Specific Timeouts:**

| Environment | App Timeout | Artillery Timeout | Margin | Notes |
|-------------|-------------|-------------------|---------|-------|
| **🏠 Local** | 6s | 7s | 1s | Development testing |
| **🔧 Dev** | 6s | 7s | 1s | Integration validation |
| **🚧 Preprod** | 6s | 8s | 2s | Higher margin for network latency |
| **🏭 Prod** | 6s | 8s | 2s | Production safety margin |

**⚡ Timeout Best Practices:**
- **Artillery > App**: Always set Artillery timeout higher than application
- **Margin Formula**: `Artillery = App + Network Buffer (1-2s)`
- **Production**: Use larger margins to account for network variability
- **Debugging**: Lower timeouts help identify performance issues faster

### 🔥 Local High-Stress Configuration

**New Local Test Profile** - Designed to push your application to its limits:

```javascript
phases: [
  { duration: 120, arrivalRate: 25 },  // 🔼 Warm-up: ~3,000 users
  { duration: 300, arrivalRate: 50 },  // 🔥 Peak: ~15,000 users  
  { duration: 180, arrivalRate: 75 },  // 🚨 Stress: ~13,500 users
  { duration: 120, arrivalRate: 25 }   // 🔽 Cool-down: ~3,000 users
]
// Total: ~34,500 users over 12 minutes!
```

**⚠️ High-Load Testing Warning:**
- Monitor your system resources closely
- Ensure adequate database connections
- Watch for memory leaks and CPU spikes
- Have rollback plan if system becomes unstable
- Consider reducing load if response times exceed 5 seconds

### 🔄 Template System Architecture

The `template.yaml` uses dynamic environment variable substitution:

```yaml
config:
  target: ${ARTILLERY_TARGET}
  ${ARTILLERY_PHASES}
  processor: './user-flow.mjs'

scenarios:
  - name: ${ARTILLERY_SCENARIO_NAME}
    flow:
      # 🔐 Authentication Flow
      - post:
          url: "/api/v1/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          beforeRequest: "generateLoginCredentials"
          capture:
            - json: "$.accessToken"
              as: "authToken"
      
      # 🐱 Core Cat Operations (Primary Business Logic)
      - get:
          url: "/api/v1/cats"        # List cats (50% weight)
          headers:
            Authorization: "Bearer {{ authToken }}"
      
      - post:
          url: "/api/v1/cats"        # Create cats (30% weight)
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "Artillery Cat {{ $randomString() }}"
            age: "{{ $randomInt(1, 15) }}"
            breed: "{{ $randomPickValue(['Persian', 'Siamese', 'Maine Coon']) }}"
      
      - think: ${ARTILLERY_THINK_TIME}
      
      # 👥 Supporting Operations  
      - get:
          url: "/api/v1/users"       # List users (20% weight)
          headers:
            Authorization: "Bearer {{ authToken }}"
```

**🎯 Test Flow Strategy:**
- **Authentication First**: Realistic login with dynamic credentials
- **Cat-Focused Operations**: 80% of traffic on core business entities (cats)
- **Realistic Weights**: 50% reads, 30% creates, 20% user management
- **Dynamic Data**: Random cat names, ages, and breeds for realistic testing
- **Think Time**: Natural pauses between operations for realistic user behavior

### 🔒 Security & Credential Management

**Environment Variables (.env):**
```env
# 🎯 Target Configuration
ARTILLERY_TARGET=http://localhost:5000

# 🌍 Environment Selection  
ARTILLERY_ENV=local

# 🔐 Test Credentials (externalized for security)
ARTILLERY_TEST_EMAIL=test@example.com
ARTILLERY_TEST_PASSWORD=secure_password_123

# ⚙️ Optional Overrides
ARTILLERY_THINK_TIME=2
```

## 🔧 Troubleshooting & Best Practices

### 🚨 Common Issues & Solutions

**❌ "envsubst: command not found"**
```bash
# macOS
brew install gettext

# Ubuntu/Debian  
sudo apt-get install gettext-base

# Verify installation
envsubst --version
```

**❌ "Missing environment variables"**
```bash
# Verify .env file exists in project root
ls -la .env

# Check required variables are set
grep -E "ARTILLERY_(TARGET|TEST_EMAIL|TEST_PASSWORD)" .env

# Run setup verification
make artillery-setup
```

**❌ "Connection refused / Target unreachable"**
```bash
# Verify target is running
curl ${ARTILLERY_TARGET}/health

# Check network connectivity
ping localhost # for local targets

# Update target in .env if needed
ARTILLERY_TARGET=http://localhost:5000
```

**❌ "Authentication failures"**
```bash
# Verify test credentials are valid
curl -X POST ${ARTILLERY_TARGET}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Update credentials in .env
ARTILLERY_TEST_EMAIL=valid@email.com
ARTILLERY_TEST_PASSWORD=valid_password
```

### 🎯 Performance Optimization Tips

**🚀 Database Performance Enhancements:**

The Artillery testing system has been optimized with **16 PostgreSQL performance indexes** for high-scale testing:

```sql
-- Text Search Optimization (resolves ILIKE query bottlenecks)
CREATE INDEX idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
CREATE INDEX idx_roles_name_trgm ON roles USING gin (name gin_trgm_ops);

-- Pagination & Sorting Optimization  
CREATE INDEX idx_users_deleted_name_created ON users (deleted_at, name, created_at);
CREATE INDEX idx_roles_deleted_created_id ON roles (deleted_at, created_at, id);

-- Junction Table Performance (JOIN optimization)
CREATE INDEX idx_users_roles_user_id ON users_roles (users_id);
CREATE INDEX idx_permissions_roles_role_id ON permissions_roles (roles_id);
```

**📊 Expected Performance Improvements:**
- **ILIKE queries**: 10-100x faster text search
- **Pagination**: 5-20x improvement in large datasets
- **JOINs**: 3-10x faster relationship queries
- **API Capacity**: Estimated increase from ~37 to 50-70 users/s

**🚀 For Better Performance:**
- Use dedicated test environment (avoid localhost in prod scenarios)
- Increase system file descriptor limits for high-load tests
- Monitor target system resources during tests
- Use realistic think times (1-5 seconds between requests)
- Implement gradual ramp-up phases to avoid overwhelming targets

**📊 Interpreting Results:**
- **Success Rate < 95%**: Investigate errors and target capacity
- **High Response Times**: Check target performance and network latency  
- **Failed Requests**: Review logs for authentication or server errors
- **ETIMEDOUT Errors**: Check if Artillery timeout > App timeout (currently 7s > 6s ✅)

### ⚡ Timeout Troubleshooting

**Common Timeout Issues:**

```bash
# ❌ Artillery timeout too low (< app timeout)
errors.ETIMEDOUT: 1000+ errors
# ✅ Solution: Increase Artillery timeout in config/*.mjs

# ❌ App timeout too low for load testing
errors.ETIMEDOUT: High errors under stress
# ✅ Solution: Check .env TIMEOUT=5000 setting

# ❌ Connection timeout issues
errors.ECONNRESET: Multiple connection drops
# ✅ Solution: Increase connectTimeout: 3000 → 5000
```

**Timeout Configuration Check:**
```bash
# Check current app timeout setting
grep "TIMEOUT=" .env

# Expected: TIMEOUT=5000 (5s + 1s server = 6s total)
# Artillery should be 7-8s for safe margin
```

### 🔍 Advanced Debugging

**Enable Detailed Logging:**
```bash
# Run with debug output
DEBUG=* make artillery-local

# Artillery-specific debugging
DEBUG=artillery:* make artillery-smoke
```

**Manual Test Execution:**
```bash
# Run Artillery directly (for debugging)
cd .artillery
envsubst < template.yaml > output.yaml
artillery run output.yaml --output test-results.json
```

## 📊 Results Analysis & Monitoring

### 🎯 Understanding Test Output

**📝 Generated OUTPUT.md Structure:**
```markdown
# 🎯 Artillery Load Test Results

## 🛠️ Test Configuration  
- Environment details and target configuration
- Test phases breakdown with user simulation
- Complete configuration file reference

## 📊 Performance Summary
- Total requests and response codes breakdown
- Success rate percentage and failure analysis  
- Response time metrics (min/max/average)
- Test duration and throughput measurements

## 🔍 Full Artillery Output
- Complete Artillery execution log (filtered for readability)
- Phase-by-phase metrics progression
- Real-time performance indicators
```

**🔍 Key Performance Indicators:**

| Metric | Good Range | Warning | Critical |
|--------|------------|---------|----------|
| **Success Rate** | ≥ 95% | 90-95% | < 90% |
| **Avg Response Time** | < 500ms | 500ms-2s | > 2s |
| **P95 Response Time** | < 1s | 1s-5s | > 5s |
| **Error Rate** | < 1% | 1-5% | > 5% |

**💡 Performance Interpretation Tips:**
- **🟢 Success Rate 100%**: Excellent - system handling load perfectly
- **🟡 Response times increasing**: Monitor for capacity limits
- **🔴 High error rates**: Investigate logs for root cause
- **📈 Throughput trends**: Analyze sustained vs. peak performance

### 🎨 Visual Terminal Output Example

```bash
🎯 Running Artillery Load Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment: local
Target: http://localhost:5000
Test option: standard
Config file: .artillery/config/local.mjs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Test Summary
┌──────────────────────────────────────────────────────────┐
│ 🏠 LOCAL - Development Environment Testing        │
├──────────────────────────────────────────────────────────┤
│ 📈 Ramp-up: 60s × 5 users/s → ~300 users      │
│ 🔥 Peak Load: 120s × 10 users/s → ~1.200 users  │
│ 📉 Cool-down: 60s × 5 users/s → ~300 users     │
├──────────────────────────────────────────────────────────┤
│ 🎯 Total Impact: ~1.800 users over 4 minutes        │
└──────────────────────────────────────────────────────────┘

📊 Test Results Summary
┌──────────────────────────────────────────────────────────┐
│ 🎯 PERFORMANCE METRICS                              │
├──────────────────────────────────────────────────────────┤
│ 📈 Total Requests: 7200                          │
│ ✅ Successful (200): 5400                        │
│ 🆕 Created (201): 1800                           │
│ ❌ Failed Requests: 0                           │
│ 📊 Success Rate: 100%                          │
├──────────────────────────────────────────────────────────┤
│ ⚡ RESPONSE TIME ANALYSIS                          │
│ 🏃 Fastest Response: 1ms                   │
│ 🐌 Slowest Response: 331ms                  │
│ 📊 Average Response: 14.6ms                   │
├──────────────────────────────────────────────────────────┤
│ ⏱️ Total Duration: 4 minutes, 5 seconds                      │
│ 🎉 Test Status: ✅ ALL TESTS PASSED               │
└──────────────────────────────────────────────────────────┘

📝 .artillery/OUTPUT.md generated successfully!
```

### 🔧 Advanced Monitoring Integration

**📊 External Monitoring (Optional):**
- Integrate with Grafana for real-time dashboards
- Export metrics to InfluxDB for time-series analysis  
- Set up alerts for performance threshold breaches
- Monitor target system resources (CPU, memory, database)

**📈 Continuous Integration:**
```bash
# CI/CD Pipeline Integration Example
make artillery-smoke  # Quick validation in PR checks
make artillery-dev     # Full testing in staging deployments
```

✓ http.response_time:
  min: 45
  max: 234
  median: 87
  p95: 156
  p99: 198

✓ http.requests: 2420
✓ http.codes.200: 2420
✓ errors: 0
```

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Missing credentials | Verify `.env` file and environment variables |
| Template not found | Check `template.yaml` exists in `.artillery/` |
| Config load error | Validate `config/*.mjs` syntax and exports |
| Network errors | Verify target URL and network connectivity |

### Debug Mode

```bash
# Enable Artillery debug output
DEBUG=* make artillery-smoke

# Check generated config
cat .artillery/output.yaml

# Validate environment
make artillery-help
make artillery-setup           # Verify Artillery configuration
```

## 🔧 Advanced Usage

### Custom Environments

1. **Create new config**:
   ```bash
   cp .artillery/config/local.mjs .artillery/config/staging.mjs
   ```

2. **Update environment list** in `run-artillery.sh`:
   ```bash
   local|dev|preprod|prod|staging)
   ```

## 🚀 System Benefits & Features

### ✨ Production Advantages

**🎯 For Development Teams:**
- **Zero-Config Testing**: Simple `make` commands for any environment
- **Visual Feedback**: Immediate performance insights with colored output  
- **Documentation Automation**: Professional reports generated automatically
- **Security by Default**: Externalized credentials and secure practices

**📊 For DevOps/SRE Teams:**
- **Scalable Load Profiles**: From smoke tests to production-scale validation
- **CI/CD Integration**: Seamless pipeline integration with clear pass/fail criteria
- **Monitoring Ready**: Structured output for alerting and dashboard integration
- **Environment Consistency**: Identical testing patterns across all environments

**🔧 for QA Teams:**
- **Realistic User Simulation**: Complete authentication and business flow coverage
- **Comprehensive Reporting**: Detailed metrics for performance validation
- **Flexible Test Scenarios**: Quick smoke tests to extended stress testing
- **Clear Success Criteria**: Automated pass/fail determination with visual indicators

### 🏆 Enterprise Features

- **🔒 Security Compliant**: No hardcoded secrets, environment isolation
- **📈 Scalable Architecture**: Handles from development to production loads  
- **🎨 Professional Output**: Executive-ready reports and visual dashboards
- **🔄 Maintenance-Free**: Template-based system requires minimal updates
- **📝 Self-Documenting**: Automated documentation with complete traceability

### 🔧 CI/CD Integration Example

```yaml
# GitHub Actions Integration
name: Load Testing Pipeline
on:
  push:
    branches: [main, staging]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Environment
        run: |
          echo "ARTILLERY_TARGET=${{ secrets.STAGING_URL }}" >> .env
          echo "ARTILLERY_TEST_EMAIL=${{ secrets.TEST_EMAIL }}" >> .env
          echo "ARTILLERY_TEST_PASSWORD=${{ secrets.TEST_PASSWORD }}" >> .env
      
      - name: Run Load Tests
        run: |
          make artillery-dev-quick  # Quick validation
          
      - name: Archive Test Results
        uses: actions/upload-artifact@v3
        with:
          name: artillery-results
          path: .artillery/OUTPUT.md
```

---

## 📚 Additional Resources & Support

### 🔗 Documentation Links

- **Artillery Official Docs**: https://artillery.io/docs
- **Load Testing Best Practices**: https://artillery.io/docs/guides/performance-testing
- **Advanced Test Scenarios**: https://artillery.io/docs/guides/test-script-reference
- **CI/CD Integration Guides**: https://artillery.io/docs/guides/integration-testing

### 🆘 Getting Help

- **📋 Issues & Features**: Use project issue tracker for bug reports and feature requests
- **💡 Improvements**: Contribute enhancements to test scenarios or system features
- **📖 Documentation**: Help expand this guide or create environment-specific documentation

### 🏷️ System Information

| Component | Version/Requirement |
|-----------|-------------------|
| **Artillery System** | Production Ready v2.0 |
| **Artillery.io** | v2.0.0+ |
| **Node.js** | v16.0.0+ |
| **System Dependencies** | `gettext` (envsubst), `bash` |
| **Last Updated** | December 2025 |

---

*🎯 **Enterprise-Grade Load Testing** • Built with ❤️ for high-performance applications*