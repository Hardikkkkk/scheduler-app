/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('slot_exceptions', table => {
    table.increments('id').primary();
    table.integer('slot_id').references('id').inTable('slots').onDelete('CASCADE');
    table.date('date').notNullable();
    table.enum('status', ['edited', 'deleted']).notNullable();
    table.time('new_start_time');
    table.time('new_end_time');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('slot_exceptions');
};
