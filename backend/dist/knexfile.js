"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    development: {
        client: 'postgresql',
        connection: {
            database: process.env.DB_NAME || 'scheduler',
            user: process.env.DB_USER || 'postgres',
            password: ((_a = process.env.DB_PASSWORD) === null || _a === void 0 ? void 0 : _a.toString()) || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: './src/database/migrations',
        },
    },
    staging: {
        client: 'postgresql',
        connection: {
            database: process.env.DB_NAME || 'scheduler',
            user: process.env.DB_USER || 'postgres',
            password: ((_b = process.env.DB_PASSWORD) === null || _b === void 0 ? void 0 : _b.toString()) || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },
    production: {
        client: 'postgresql',
        connection: process.env.DATABASE_URL || {
            database: process.env.DB_NAME || 'scheduler',
            user: process.env.DB_USER || 'postgres',
            password: ((_c = process.env.DB_PASSWORD) === null || _c === void 0 ? void 0 : _c.toString()) || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },
};
exports.default = config;
