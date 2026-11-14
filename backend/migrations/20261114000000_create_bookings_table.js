/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('bookings', table => {
    table.increments('id').primary();
    table.integer('slot_id').nullable();
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.string('client_name').notNullable();
    table.string('client_email').notNullable();
    table.string('meeting_title').defaultTo('Meeting');
    table.text('notes').nullable();
    table.string('status').defaultTo('confirmed'); // confirmed, cancelled
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('bookings');
};
