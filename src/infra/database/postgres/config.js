// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

dotenv.config();

const databaseEnv = {
  local: {
    dev: {
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
    dev: {
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
  HML: {
    hml: {
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
    prd: {
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
