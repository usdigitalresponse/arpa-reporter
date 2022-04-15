/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('application_settings', function (table) {
    table.dropColumn('reporting_template')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('application_settings', function (table) {
    table.text('reporting_template').after('current_reporting_period_id')
  })
}
