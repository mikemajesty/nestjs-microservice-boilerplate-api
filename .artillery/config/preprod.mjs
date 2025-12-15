export default {
  target: process.env.ARTILLERY_TARGET,

  // ⏱️ HTTP Configuration for K8s Ingress Chain
  // Artillery → ALB → Ingress Controller → Service → Pods
  http: {
    timeout: 15000,         // 15s - ALB + Ingress + app timeout + network hops
    connectTimeout: 10000,  // 10s - Connection through ALB + Ingress
    requestTimeout: 15000,  // 15s - Full request timeout for K8s chain
    // Pool configuration for Ingress environment
    pool: {
      maxSockets: 40,       // Moderate pool - Ingress handles load balancing
      keepAlive: true       // Important for Ingress efficiency
    }
  },

  phases: [
    {
      name: 'warmup-hpa',
      duration: 120,      // Phase 1: 120s × 5 users/s = ~600 users (HPA warmup)
      arrivalRate: 5      // Gradual start for HPA to scale pods
    },
    {
      name: 'ramp-up',
      duration: 180,      // Phase 2: 180s × 15 users/s = ~2.700 users
      arrivalRate: 15     // New virtual users per second
    },
    {
      name: 'sustained-load',
      duration: 360,      // Phase 3: 360s × 30 users/s = ~10.800 users
      arrivalRate: 30     // Peak load for sustained testing
    },
    {
      name: 'stress-test',
      duration: 120,      // Phase 4: 120s × 45 users/s = ~5.400 users (stress ALB)
      arrivalRate: 45     // Test ALB + HPA scaling limits
    },
    {
      name: 'cool-down',
      duration: 180,      // Phase 5: 180s × 10 users/s = ~1.800 users
      arrivalRate: 10     // Gradual cool-down
    }
    // Total: ~21.300 users in 16 minutes (ALB + HPA optimized)
  ],
  thinkTime: 3,           // Realistic think time for production load
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test - ALB + HPA`,

  // 📊 K8s Environment-specific settings
  variables: {
    ingressTimeout: 60,         // Ingress Controller timeout (nginx default)
    hpaScaleDelay: 60,         // HPA scaling delay consideration
    serviceLatency: 10         // Service → Pod routing latency
  },

  // 🔄 Performance expectations for K8s Ingress environment
  ensure: {
    maxErrorRate: 8,           // 8% error rate (Ingress + HPA scaling)
    p95: 10000,                // P95 under 10s (ALB + Ingress + app)
    p99: 15000                 // P99 under 15s (full chain latency)
  },

  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  },
};
