"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "sequelizeConfig", {
    enumerable: true,
    get: function() {
        return sequelizeConfig;
    }
});
const _config = require("@nestjs/config");
const _colorette = require("colorette");
const _dotenv = require("dotenv");
const _fs = require("fs");
const _sequelizetypescript = require("sequelize-typescript");
const _cats = require("./schemas/cats");
(0, _dotenv.config)();
const configService = new _config.ConfigService();
const connection = `postgresql://${configService.get('POSTGRES_USER')}:${configService.get('POSTGRES_PASSWORD')}@${configService.get('POSTGRES_HOST')}:${configService.get('POSTGRES_PORT')}/${configService.get('POSTGRES_DATABASE')}`;
const sequelizeConfig = new _sequelizetypescript.Sequelize(connection, {
    dialect: 'postgres',
    benchmark: true,
    // eslint-disable-next-line no-console
    logging: (msm, timming)=>console.log((0, _colorette.blue)(`[sequelize]`), (0, _colorette.gray)(msm), `${(0, _colorette.blue)((0, _colorette.bold)(`${timming}ms`))}`)
});
sequelizeConfig.addModels([
    _cats.CatsSchema
]);
const databaseConfigMap = {
    DEV: 'development',
    TEST: 'test',
    PRD: 'production'
}[configService.get('ENV')];
const postgresConfig = sequelizeConfig.config.dialectOptions;
(0, _fs.writeFileSync)('database.json', JSON.stringify({
    [databaseConfigMap]: {
        ...postgresConfig,
        username: postgresConfig['user'],
        user: undefined,
        dialect: 'postgres'
    }
}));

//# sourceMappingURL=config.js.map