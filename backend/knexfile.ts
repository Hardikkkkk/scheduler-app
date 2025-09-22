const config = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'scheduler',
      user: 'postgres',
      password: process.env.DB_PASSWORD?.toString() || '1234',
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
      database: 'scheduler',
      user: 'postgres',
      password: process.env.DB_PASSWORD?.toString() || '1234',
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
    connection: {
      database: 'scheduler',
      user: 'postgres',
      password: process.env.DB_PASSWORD?.toString() || '1234',
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

export default config;
