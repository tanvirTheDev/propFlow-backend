"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const express = require("express");
const Sentry = require("@sentry/node");
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const winston_logger_1 = require("./config/winston.logger");
async function bootstrap() {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: winston_logger_1.winstonLogger });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:'],
            },
        },
        hsts: { maxAge: 31536000, includeSubDomains: true },
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
    const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',');
    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.enableShutdownHooks();
    if (process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('PropFlow API')
            .setDescription('Property Management API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
    }
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map