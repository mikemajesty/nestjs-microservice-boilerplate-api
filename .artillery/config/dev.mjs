export default {
  target: process.env.ARTILLERY_TARGET,
  phases: [
    {
      duration: 120,      // Phase 1: 120s × 10 users/s = ~1.200 users
      arrivalRate: 10     // New virtual users per second
    },
    {
      duration: 300,      // Phase 2: 300s × 20 users/s = ~6.000 users
      arrivalRate: 20     // New virtual users per second
    },
    {
      duration: 120,      // Phase 3: 120s × 10 users/s = ~1.200 users
      arrivalRate: 10     // New virtual users per second
    }
    // Total: ~8.400 users in 9 minutes
  ],
  thinkTime: 3,           // Delay between requests in seconds
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test`,
  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
