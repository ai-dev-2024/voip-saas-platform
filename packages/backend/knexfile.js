import config from './src/config/index.js';

export default {
    client: 'pg',
    connection: config.databaseUrl,
    migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
    },
    seeds: {
        directory: './seeds'
    }
};
