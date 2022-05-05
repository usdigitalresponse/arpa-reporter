/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.dropTable('projects')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.createTable('projects', function (table) {
    table.increments('id').primary()
    table.text('code').notNullable().unique()
    table.text('name').notNullable().unique()
    table.integer('agency_id').unsigned()
    table.text('status')
    table.text('description')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.text('created_by')
    table.timestamp('updated_at')
    table.text('updated_by')
    table.integer('created_in_period')

    table.foreign('agency_id').references('agencies.id')
    table.foreign('created_in_period').references('reporting_periods.id')
  })
}
