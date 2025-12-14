export default {
  target: process.env.ARTILLERY_TARGET,
  phases: [
    {
      duration: 180,      // Phase 1: 180s × 15 users/s = ~2.700 users
      arrivalRate: 15     // New virtual users per second
    },
    {
      duration: 360,      // Phase 2: 360s × 30 users/s = ~10.800 users
      arrivalRate: 30     // New virtual users per second
    },
    {
      duration: 180,      // Phase 3: 180s × 10 users/s = ~1.800 users
      arrivalRate: 10     // New virtual users per second
    }
    // Total: ~15.300 users in 12 minutes
  ],
  thinkTime: 4,           // Delay between requests in seconds
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test`,
  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  },
};
