export default {
  target: process.env.ARTILLERY_TARGET,
  phases: [
    {
      duration: 300,      // Phase 1: 300s × 50 users/s = ~15.000 users
      arrivalRate: 50     // New virtual users per second
    },
    {
      duration: 600,      // Phase 2: 600s × 100 users/s = ~60.000 users
      arrivalRate: 100    // New virtual users per second
    },
    {
      duration: 300,      // Phase 3: 300s × 25 users/s = ~7.500 users
      arrivalRate: 25     // New virtual users per second
    }
    // Total: ~82.500 users in 20 minutes
  ],
  thinkTime: 5,           // Delay between requests in seconds
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test`,
  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
