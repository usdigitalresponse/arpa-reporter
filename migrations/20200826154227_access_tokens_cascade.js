exports.up = async function (knex) {
  return knex.schema
    .table('access_tokens', function (table) {
      table.dropForeign('user_id')
    })
    .table('access_tokens', function (table) {
      table
        .foreign('user_id')
        .references('users.id')
        .onDelete('CASCADE')
    })
}

exports.down = function (knex) {
  return knex.schema
    .table('access_tokens', function (table) {
      table.dropForeign('user_id')
    })
    .table('access_tokens', function (table) {
      table.foreign('user_id').references('users.id')
    })
}
