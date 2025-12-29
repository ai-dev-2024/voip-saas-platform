/**
 * Extended schema for VoIP SaaS Platform
 * Adds contacts, push tokens, refresh tokens, and calling rates
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Refresh Tokens table for secure token rotation
    await knex.schema.createTable('refresh_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('token_hash', 255).notNullable().unique();
        table.string('device_info', 255); // Browser/device identifier
        table.string('ip_address', 45); // Support IPv6
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.boolean('revoked').defaultTo(false);

        table.index(['user_id']);
        table.index(['token_hash']);
        table.index(['expires_at']);
    });

    // Contacts table for user's contact list
    await knex.schema.createTable('contacts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('name', 255).notNullable();
        table.string('phone_number', 20);
        table.string('email', 255);
        table.text('avatar_url');
        table.boolean('is_favorite').defaultTo(false);
        table.text('notes');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.index(['user_id', 'name']);
        table.index(['user_id', 'is_favorite']);
    });

    // Push Notification Tokens for mobile/web push
    await knex.schema.createTable('push_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.text('token').notNullable();
        table.enum('platform', ['ios', 'android', 'web']).notNullable();
        table.string('device_id', 255); // Unique device identifier
        table.boolean('active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.unique(['user_id', 'device_id']);
        table.index(['user_id', 'active']);
    });

    // Calling Rates cache (pulled from Telnyx, cached locally)
    await knex.schema.createTable('calling_rates', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('country_code', 3).notNullable();
        table.string('country_name', 100);
        table.string('prefix', 20); // Phone number prefix
        table.decimal('rate_per_minute', 10, 4).notNullable();
        table.decimal('connection_fee', 10, 4).defaultTo(0);
        table.string('currency', 3).defaultTo('USD');
        table.timestamp('updated_at').defaultTo(knex.fn.now());

        table.unique(['country_code', 'prefix']);
        table.index(['country_code']);
    });

    // Add avatar_url and timezone to users table
    await knex.schema.alterTable('users', (table) => {
        table.text('avatar_url');
        table.string('timezone', 50).defaultTo('UTC');
    });

    // Add balance_after to transactions for audit trail
    await knex.schema.alterTable('transactions', (table) => {
        table.decimal('balance_after', 10, 2);
    });

    // Add features column to did_numbers for storing feature flags
    await knex.schema.alterTable('did_numbers', (table) => {
        table.jsonb('features').defaultTo('[]');
        table.boolean('sms_enabled').defaultTo(false);
        table.boolean('mms_enabled').defaultTo(false);
        table.boolean('voice_enabled').defaultTo(true);
        table.string('forward_to', 20); // Call forwarding number
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    // Remove columns from did_numbers
    await knex.schema.alterTable('did_numbers', (table) => {
        table.dropColumn('features');
        table.dropColumn('sms_enabled');
        table.dropColumn('mms_enabled');
        table.dropColumn('voice_enabled');
        table.dropColumn('forward_to');
    });

    // Remove columns from transactions
    await knex.schema.alterTable('transactions', (table) => {
        table.dropColumn('balance_after');
    });

    // Remove columns from users
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('avatar_url');
        table.dropColumn('timezone');
    });

    // Drop tables
    await knex.schema.dropTableIfExists('calling_rates');
    await knex.schema.dropTableIfExists('push_tokens');
    await knex.schema.dropTableIfExists('contacts');
    await knex.schema.dropTableIfExists('refresh_tokens');
}
