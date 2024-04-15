// eslint-disable-next-line @typescript-eslint/no-var-requires
const { green } = require('colorette');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');

dotenv.config();

const databaseEnv = {
  local: {
    username: process.env['POSTGRES_USER'],
    password: process.env['POSTGRES_PASSWORD'],
    database: process.env['POSTGRES_DATABASE'],
    host: process.env['POSTGRES_HOST'],
    port: process.env['POSTGRES_PORT'],
    dialect: 'postgres'
  },
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
  },
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
  },
  prod: {
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
}[process.env['NODE_ENV']];

// eslint-disable-next-line no-console
console.log(green(`ENV: ${process.env['NODE_ENV']} postgres migration running.\n`));

module.exports = {
  ...databaseEnv
};
