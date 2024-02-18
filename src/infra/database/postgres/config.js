// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

dotenv.config();

const databaseEnv = {
  local: {
    development: {
      username: process.env['POSTGRES_USER'],
      password: process.env['POSTGRES_PASSWORD'],
      database: process.env['POSTGRES_DATABASE'],
      host: process.env['POSTGRES_HOST'],
      port: process.env['POSTGRES_PORT'],
      dialect: 'postgres',
      dialectOptions: {
        bigNumberStrings: true
      }
    }
  },
  DEV: {
    development: {
      username: process.env['POSTGRES_USER'],
      password: process.env['POSTGRES_PASSWORD'],
      database: process.env['POSTGRES_DATABASE'],
      host: process.env['POSTGRES_HOST'],
      port: process.env['POSTGRES_PORT'],
      dialect: 'postgres',
      dialectOptions: {
        bigNumberStrings: true
      }
    }
  },
  PRD: {
    production: {
      username: process.env['POSTGRES_USER'],
      password: process.env['POSTGRES_PASSWORD'],
      database: process.env['POSTGRES_DATABASE'],
      host: process.env['POSTGRES_HOST'],
      port: process.env['POSTGRES_PORT'],
      dialect: 'postgres',
      dialectOptions: {
        bigNumberStrings: true,
        ssl: {
          ca: null
        }
      }
    }
  }
}[process.env['ENV']];

module.exports = {
  ...databaseEnv
};
