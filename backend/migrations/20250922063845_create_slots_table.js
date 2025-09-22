/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('slots', table => {
    table.increments('id').primary();
    table.integer('day_of_week').notNullable(); // 0: Sunday, 1: Monday, etc.
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('slots');
}
