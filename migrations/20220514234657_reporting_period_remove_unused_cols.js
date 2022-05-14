/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('reporting_periods', function (table) {
    table.dropColumn('final_report_file')
    table.dropColumn('crf_end_date')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('reporting_periods', function (table) {
    table.string('final_report_file')
    table.date('crf_end_date')
  })
}
