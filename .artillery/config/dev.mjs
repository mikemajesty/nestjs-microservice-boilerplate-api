export default {
  target: process.env.ARTILLERY_TARGET,

  // ⏱️ HTTP Configuration for Dev K8s Ingress
  // Artillery → Ingress Controller → Service → Pods (dev pode não ter ALB)
  http: {
    timeout: 12000,         // 12s - Ingress + app timeout + dev latency
    connectTimeout: 8000,   // 8s - Connection through Ingress
    requestTimeout: 12000,  // 12s - Full request timeout
    pool: {
      maxSockets: 25,       // Lower pool for dev environment
      keepAlive: true       // Ingress connection reuse
    }
  },

  phases: [
    {
      name: 'warmup-hpa',
      duration: 60,       // Phase 1: 60s × 5 users/s = ~300 users (HPA warmup)
      arrivalRate: 5      // Gentle start for dev HPA
    },
    {
      name: 'ramp-up',
      duration: 120,      // Phase 2: 120s × 10 users/s = ~1.200 users
      arrivalRate: 10     // New virtual users per second
    },
    {
      name: 'sustained-load',
      duration: 300,      // Phase 3: 300s × 20 users/s = ~6.000 users
      arrivalRate: 20     // Peak load for dev testing
    },
    {
      name: 'cool-down',
      duration: 120,      // Phase 4: 120s × 10 users/s = ~1.200 users
      arrivalRate: 10     // Gradual cool-down
    }
    // Total: ~8.700 users in 10 minutes (Dev ALB optimized)
  ],
  thinkTime: 3,           // Realistic think time for dev testing
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test - DEV ALB`,

  // 📊 Development environment settings
  variables: {
    healthCheckInterval: 30,    // ALB health check frequency
    hpaScaleDelay: 45          // Faster HPA scaling in dev
  },

  // 🔄 Performance expectations for dev ALB
  ensure: {
    maxErrorRate: 10,          // 10% error rate acceptable in dev
    p95: 6000,                 // P95 under 6s for dev
    p99: 10000                 // P99 under 10s for dev
  },

  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
