const config = {
  development: {
    client: 'postgresql',
    connection: {
      database: process.env.DB_NAME || 'scheduler',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD?.toString() || '1234',
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
      password: process.env.DB_PASSWORD?.toString() || '1234',
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
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  },
  pool: { min: 2, max: 10 },
  migrations: { tableName: 'knex_migrations' },
},

};

export default config;
