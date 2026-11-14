import type { Knex } from 'knex';

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
      password: process.env.DB_PASSWORD?.toString() || '1234',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
    };

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
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
      directory: './migrations',
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
      directory: './migrations',
    },
  },
};

export default config;
