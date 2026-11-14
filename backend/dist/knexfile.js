"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const migrationsDirectory = path_1.default.resolve(__dirname.endsWith('dist') ? path_1.default.join(__dirname, '..', 'migrations') : path_1.default.join(__dirname, 'migrations'));
const connection = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('localhost')
            ? false
            : { rejectUnauthorized: false },
    }
    : {
        database: process.env.DB_NAME || 'scheduler',
        user: process.env.DB_USER || 'postgres',
        password: ((_a = process.env.DB_PASSWORD) === null || _a === void 0 ? void 0 : _a.toString()) || '1234',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
    };
const config = {
    development: {
        client: 'postgresql',
        connection,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: migrationsDirectory,
            loadExtensions: ['.js', '.ts'],
        },
    },
    staging: {
        client: 'postgresql',
        connection,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: migrationsDirectory,
            loadExtensions: ['.js', '.ts'],
        },
    },
    production: {
        client: 'postgresql',
        connection,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: migrationsDirectory,
            loadExtensions: ['.js', '.ts'],
        },
    },
};
exports.default = config;
