"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLogger = void 0;
const nest_winston_1 = require("nest-winston");
const winston = require("winston");
exports.winstonLogger = nest_winston_1.WinstonModule.createLogger({
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? winston.format.combine(winston.format.timestamp(), winston.format.json())
                : winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, context }) => `${timestamp} [${context ?? 'App'}] ${level}: ${message}`)),
        }),
    ],
});
//# sourceMappingURL=winston.logger.js.map