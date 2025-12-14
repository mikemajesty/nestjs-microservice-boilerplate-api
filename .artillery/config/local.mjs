export default {
  target: process.env.ARTILLERY_TARGET,
  phases: [
    {
      duration: 120,      // Phase 1: 120s × 25 users/s = ~3.000 users
      arrivalRate: 25     // New virtual users per second
    },
    {
      duration: 300,      // Phase 2: 300s × 50 users/s = ~15.000 users (PEAK LOAD!)
      arrivalRate: 50     // New virtual users per second
    },
    {
      duration: 180,      // Phase 3: 180s × 75 users/s = ~13.500 users (STRESS!)
      arrivalRate: 75     // New virtual users per second
    },
    {
      duration: 120,      // Phase 4: 120s × 25 users/s = ~3.000 users
      arrivalRate: 25     // New virtual users per second
    }
    // Total: ~34.500 users in 12 minutes (HIGH STRESS TEST!)
  ],
  thinkTime: 1,           // Faster think time for more aggressive testing
  scenarioName: `${process.env.ARTILLERY_ENV} Artillery Test - HIGH LOAD`,
  testCredentials: {
    email: process.env.ARTILLERY_TEST_EMAIL,
    password: process.env.ARTILLERY_TEST_PASSWORD
  }
};
