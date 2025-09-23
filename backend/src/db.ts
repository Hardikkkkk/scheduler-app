import knex from 'knex';
import knexConfig from '../knexfile';

type Env = 'development' | 'production' | 'staging';
const environment = (process.env.NODE_ENV as Env) || 'development';
const config = knexConfig[environment];

const db = knex(config);

export default db;
