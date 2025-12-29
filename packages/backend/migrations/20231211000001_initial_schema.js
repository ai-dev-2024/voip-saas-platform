/**
 * Initial database schema for VoIP SaaS Platform
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
    // Enable UUID extension
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Users table
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email', 255).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.string('first_name', 100);
        table.string('last_name', 100);
        table.boolean('email_verified').defaultTo(false);
        table.boolean('phone_verified').defaultTo(false);
        table.string('phone_number', 20);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Wallets table
    await knex.schema.createTable('wallets', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.decimal('balance', 10, 2).defaultTo(0.00);
        table.string('currency', 3).defaultTo('USD');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Transactions table
    await knex.schema.createTable('transactions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
        table.enum('type', ['credit', 'debit', 'refund']).notNullable();
        table.decimal('amount', 10, 2).notNullable();
        table.text('description');
        table.string('stripe_payment_id', 255);
        table.string('reference_type', 50); // 'call', 'did_purchase', 'topup'
        table.uuid('reference_id');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // DID Numbers table
    await knex.schema.createTable('did_numbers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.string('phone_number', 20).notNullable();
        table.string('telnyx_number_id', 255).notNullable();
        table.string('country_code', 2);
        table.string('region', 100);
        table.enum('type', ['local', 'toll_free', 'mobile']).defaultTo('local');
        table.decimal('monthly_cost', 10, 2);
        table.decimal('setup_cost', 10, 2).defaultTo(0);
        table.enum('status', ['active', 'suspended', 'released']).defaultTo('active');
        table.timestamp('purchased_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // CDR (Call Detail Records) table
    await knex.schema.createTable('cdr', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
        table.uuid('did_number_id').references('id').inTable('did_numbers').onDelete('SET NULL');
        table.string('call_id', 255).notNullable().unique();
        table.string('telnyx_call_control_id', 255);
        table.enum('direction', ['inbound', 'outbound']).notNullable();
        table.string('from_number', 50);
        table.string('to_number', 50);
        table.timestamp('start_time').notNullable();
        table.timestamp('answer_time');
        table.timestamp('end_time');
        table.integer('duration_seconds').defaultTo(0);
        table.enum('status', ['initiated', 'ringing', 'answered', 'completed', 'missed', 'busy', 'failed']).defaultTo('initiated');
        table.enum('hangup_cause', ['normal_clearing', 'user_busy', 'no_answer', 'call_rejected', 'network_error', 'other']).nullable();
        table.decimal('cost', 10, 4).defaultTo(0);
        table.text('recording_url');
        table.jsonb('metadata');
        table.timestamp('created_at').defaultTo(knex.fn.now());

        table.index(['user_id', 'created_at']);
        table.index(['call_id']);
    });

    // Stripe Customers table
    await knex.schema.createTable('stripe_customers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
        table.string('stripe_customer_id', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // WebRTC Credentials table (for generating Telnyx JWT tokens)
    await knex.schema.createTable('webrtc_credentials', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('telnyx_credential_id', 255);
        table.string('sip_username', 255);
        table.boolean('active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists('webrtc_credentials');
    await knex.schema.dropTableIfExists('stripe_customers');
    await knex.schema.dropTableIfExists('cdr');
    await knex.schema.dropTableIfExists('did_numbers');
    await knex.schema.dropTableIfExists('transactions');
    await knex.schema.dropTableIfExists('wallets');
    await knex.schema.dropTableIfExists('users');
}
