export function generateLoginCredentials(requestParams, context, ee, next) {
  const environment = process.env.ARTILLERY_ENV;

  if (!environment) {
    const error = new Error('ARTILLERY_ENV is not set in environment variables');
    console.error(error.message);
    return next(error);
  }

  const email = process.env.ARTILLERY_TEST_EMAIL;
  const password = process.env.ARTILLERY_TEST_PASSWORD;

  if (!email || !password) {
    const error = new Error(`Missing artillery credentials: email=${email ? 'set' : 'missing'}, password=${password ? 'set' : 'missing'}`);
    console.error(error.message);
    return next(error);
  }

  if (!context.vars) {
    context.vars = {};
  }

  context.vars.email = email;
  context.vars.password = password;

  console.log(`✅ Using credentials from .env for environment: ${environment}`);
  return next();
}

export function generateCatData(requestParams, context, ee, next) {
  if (!context.vars) {
    context.vars = {};
  }

  const catNames = [
    "Artillery Cat", "Test Cat", "Load Cat", "Stress Cat", "Benchmark Cat",
    "Thunder Cat", "Lightning Cat", "Storm Cat", "Speed Cat", "Power Cat"
  ];

  const breeds = [
    'Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll',
    'Bengal', 'Russian Blue', 'Abyssinian', 'Scottish Fold', 'Sphynx'
  ];

  // Generate random data
  context.vars.catName = catNames[Math.floor(Math.random() * catNames.length)] + " " + Math.floor(Math.random() * 1000);
  context.vars.catAge = Math.floor(Math.random() * 15) + 1; // Number, not string!
  context.vars.catBreed = breeds[Math.floor(Math.random() * breeds.length)];

  return next();
}

export default {
  generateLoginCredentials,
  generateCatData
};