import type { Knex } from 'knex';
import path from 'path';

const migrationsDirectory = path.resolve(
  __dirname.endsWith('dist') ? path.join(__dirname, '..', 'migrations') : path.join(__dirname, 'migrations')
);

const getDbConnection = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      database: process.env.DB_NAME || 'scheduler',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD?.toString() || '1234',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
    };
  }

  // Determine SSL configuration
  // Render internal URLs (e.g. hostname starting with dpg- and without .render.com) do NOT support SSL.
  // External URLs (e.g. *.render.com, Neon, Supabase) require SSL.
  const isRenderInternal = (dbUrl.includes('dpg-') && !dbUrl.includes('.render.com')) || dbUrl.includes('.internal');
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  if (isRenderInternal || isLocal) {
    return {
      connectionString: dbUrl,
      ssl: false,
    };
  }

  return {
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  };
};

const connection = getDbConnection();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection,
    pool: {
      min: 0,
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
      min: 0,
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
      min: 0,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: migrationsDirectory,
      loadExtensions: ['.js', '.ts'],
    },
  },
};

export default config;
