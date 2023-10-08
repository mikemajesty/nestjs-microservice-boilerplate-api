"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelizeConfig = void 0;
const config_1 = require("@nestjs/config");
const colorette_1 = require("colorette");
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const sequelize_typescript_1 = require("sequelize-typescript");
const cats_1 = require("./schemas/cats");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
const connection = `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DATABASE')}`;
const sequelizeConfig = new sequelize_typescript_1.Sequelize(connection, {
    dialect: 'postgres',
    benchmark: true,
    logging: (msm, timming) => console.log((0, colorette_1.blue)(`[sequelize]`), (0, colorette_1.gray)(msm), `${(0, colorette_1.blue)((0, colorette_1.bold)(`${timming}ms`))}`)
});
exports.sequelizeConfig = sequelizeConfig;
sequelizeConfig.addModels([cats_1.CatsSchema]);
const databaseConfigMap = {
    DEV: 'development',
    TEST: 'test',
    PRD: 'production'
}[configService.get('ENV')];
const postgresConfig = sequelizeConfig.config.dialectOptions;
(0, fs_1.writeFileSync)('database.json', JSON.stringify({
    [databaseConfigMap]: Object.assign(Object.assign({}, postgresConfig), { username: postgresConfig['user'], user: undefined, dialect: 'postgres' })
}));
//# sourceMappingURL=config.js.map