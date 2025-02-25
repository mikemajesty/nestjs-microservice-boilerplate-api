const pack = require('./package.json');

module.exports = {
  apps: [
    {
      name: pack.name,
      script: './dist/main.js',
      env_production: {
        NODE_ENV: 'prod'
      }
    }
  ]
};
