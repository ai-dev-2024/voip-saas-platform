import knex from 'knex';
import config from './index.js';

const db = knex({
    client: 'pg',
    connection: config.databaseUrl,
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: '../migrations'
    }
});

export default db;
