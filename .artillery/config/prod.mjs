export default {
  target: process.env.ARTILLERY_TARGET,

  // ⏱️ HTTP Configuration for Production K8s Ingress + ALB
  // Artillery → ALB → Ingress Controller → Service → Pods (multi-AZ)
  http: {
    timeout: 20000,         // 20s - Full chain: ALB + Ingress + app + multi-AZ
    connectTimeout: 12000,  // 12s - Connection through ALB + Ingress
    requestTimeout: 20000,  // 20s - Full request timeout for production chain
    // Advanced pool for production Ingress + ALB
    pool: {
      maxSockets: 60,       // Higher pool but Ingress balances load
      maxFreeSockets: 15,   // Keep connections warm through Ingress
      keepAlive: true       // Critical for Ingress performance
    }
  },

  phases: [
    {
      name: 'hpa-warmup',
      duration: 180,      // Phase 1: 180s × 10 users/s = ~1.800 users (HPA warmup)
      arrivalRate: 10     // Conservative start for HPA scaling
    },
    {
      name: 'gradual-ramp',
      duration: 300,      // Phase 2: 300s × 30 users/s = ~9.000 users
      arrivalRate: 30     // Gradual increase
    },
    {
      name: 'production-load',
      duration: 600,      // Phase 3: 600s × 50 users/s = ~30.000 users
      arrivalRate: 50     // Sustained production load
    },
    {
      name: 'peak-stress',
      duration: 300,      // Phase 4: 300s × 75 users/s = ~22.500 users
      arrivalRate: 75     // Peak stress test
    },
    {
      name: 'maximum-capacity',
      duration: 180,      // Phase 5: 180s × 100 users/s = ~18.000 users
      arrivalRate: 100    // Maximum capacity test
    },
    {
      name: 'graceful-cooldown',
      duration: 300,      // Phase 6: 300s × 25 users/s = ~7.500 users
      arrivalRate: 25     // Extended cool-down
    }
    // Total: ~88.800 users in 30 minutes (Production optimized)
  ],
  thinkTime: 5,           // Realistic production user behavior
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test - PRODUCTION ALB`,

  // 📊 Production environment settings
  variables: {
    healthCheckInterval: 30,    // ALB health check frequency
    hpaScaleDelay: 90,         // Conservative HPA scaling
    multiAzLatency: 50         // Multi-AZ latency consideration
  },

  // 🔄 Strict performance expectations for production
  ensure: {
    maxErrorRate: 1,           // 1% error rate maximum in production
    p95: 5000,                 // P95 under 5s for production SLA
    p99: 10000,                // P99 under 10s for production SLA
    median: 2000               // Median under 2s
  },

  // 🛡️ Production safety settings
  processor: {
    // Graceful degradation on errors
    maxVusers: 1000,           // Safety limit for concurrent users
    errorBudget: 50            // Stop test if 50+ consecutive errors
  },

  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
