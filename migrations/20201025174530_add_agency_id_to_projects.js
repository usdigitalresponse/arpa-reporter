
exports.up = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.integer('agency_id').unsigned()
      table.foreign('agency_id').references('agencies.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('projects', function (table) {
      table.dropColumn('agency_id')
    })
}
