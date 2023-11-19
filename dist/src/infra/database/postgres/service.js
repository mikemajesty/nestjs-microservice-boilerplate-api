"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeService = void 0;
const package_json_1 = require("../../../../package.json");
class SequelizeService {
    constructor(instance, logger) {
        this.instance = instance;
        this.logger = logger;
    }
    getConnection({ URI }) {
        return {
            type: 'postgres',
            url: URI,
            database: package_json_1.name
        };
    }
    async connect() {
        try {
            const conn = await this.instance.sync();
            this.logger.log('Sequelize connected!');
            return conn;
        }
        catch (error) {
            this.logger.fatal(error);
        }
    }
    getDatabase() {
        return this.instance;
    }
}
exports.SequelizeService = SequelizeService;
//# sourceMappingURL=service.js.map