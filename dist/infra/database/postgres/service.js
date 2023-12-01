"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SequelizeService", {
    enumerable: true,
    get: function() {
        return SequelizeService;
    }
});
const _packagejson = require("package.json");
let SequelizeService = class SequelizeService {
    getConnection({ URI }) {
        return {
            type: 'postgres',
            url: URI,
            database: _packagejson.name
        };
    }
    async connect() {
        try {
            const conn = await this.instance.sync();
            this.logger.log('Sequelize connected!');
            return conn;
        } catch (error) {
            this.logger.fatal(error);
        }
    }
    getDatabase() {
        return this.instance;
    }
    constructor(instance, logger){
        this.instance = instance;
        this.logger = logger;
    }
};

//# sourceMappingURL=service.js.map