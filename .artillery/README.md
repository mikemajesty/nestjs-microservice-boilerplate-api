# 🎯 Artillery Load Testing System

**Production-ready load testing** for high-scale application validation.

> ⚡ **High-performance testing** • 📊 **Visual dashboards** • 📝 **Auto-generated reports**

## 📚 Documentation

- **Artillery Official Docs**: https://artillery.io/docs
- **Load Testing Guide**: https://artillery.io/docs/get-started/load-testing-guide

## 🏗️ System Features

- **🎨 Visual Terminal Output**: Colorized reports and progress indicators
- **📊 Automated Reports**: Professional OUTPUT.md with complete metrics
- **⚡ Multi-Environment**: Local, dev, preprod, production configurations  
- **🔒 Secure Credentials**: Environment variables for sensitive data
- **🎯 Realistic Flows**: Authentication and business logic simulation

## 📁 File Structure

```
.artillery/
├── 📄 template.yaml        # Test configuration template
├── 📄 OUTPUT.md            # Auto-generated test reports
├── 🚀 run-artillery.sh     # Main test execution script
├── 📄 user-flow.mjs        # User flow scenarios
└── 📁 config/              # Environment-specific configs
    ├── 🏠 local.mjs        # Local development
    ├── 🔧 dev.mjs          # Development environment
    ├── 🚧 preprod.mjs      # Pre-production
    └── 🏭 prod.mjs         # Production
```

## 🚀 Quick Start

### 📋 Setup

1. **Environment Configuration** (.env file):
   ```env
   ARTILLERY_TARGET=http://localhost:5000
   ARTILLERY_ENV=local
   ARTILLERY_TEST_EMAIL=test@example.com
   ARTILLERY_TEST_PASSWORD=password123
   ```

2. **Install Artillery**:
   ```bash
   npm install -g artillery@latest
   ```

### 🎯 Running Tests

```bash
# Environment-specific tests
make artillery-local      # Local development (4min, ~1.8K users)
make artillery-dev        # Development env (9min, ~8.4K users)
make artillery-preprod    # Pre-production (12min, ~15.3K users)
make artillery-prod       # Production scale (20min, ~82.5K users)

# Quick tests
make artillery-smoke      # Smoke test (10s, ~10 users)
make artillery-quick      # Quick test (30s, ~300 users)

# Help
make artillery-help       # Show all options
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

## 🔧 Troubleshooting

### 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| **envsubst not found** | `brew install gettext` (macOS) |
| **Missing env variables** | Check `.env` file, run `make artillery-setup` |
| **Connection refused** | Verify target is running: `curl $ARTILLERY_TARGET/health` |
| **Auth failures** | Update test credentials in `.env` |
| **Timeout errors** | Check Artillery timeout > app timeout |

### 📊 Performance Metrics

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Success Rate** | ≥ 95% | 90-95% | < 90% |
| **Avg Response** | < 500ms | 500ms-2s | > 2s |
| **Error Rate** | < 1% | 1-5% | > 5% |

### 🔍 Debugging

```bash
# Enable detailed logging
DEBUG=* make artillery-smoke

# Manual execution
cd .artillery
envsubst < template.yaml > output.yaml
artillery run output.yaml
```

## 🔧 Custom Environments

1. **Create new config**:
   ```bash
   cp .artillery/config/local.mjs .artillery/config/staging.mjs
   ```

2. **Update run script** to include new environment

---

*🎯 **Production-Ready Load Testing** • Built for high-performance applications*