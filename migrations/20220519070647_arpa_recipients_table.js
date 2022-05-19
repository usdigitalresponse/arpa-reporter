exports.up = function (knex) {
  return knex.schema
    .createTable('arpa_recipients', function (table) {
      table.increments('id').primary()
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
      table.timestamp('updated_at')
      table.integer('updated_by').unsigned()
      table.string('uei').unique()
      table.string('tin').unique()
      table.text('record')
      table.integer('upload_id').unsigned()

      table.foreign('updated_by').references('users.id')
      table.foreign('upload_id').references('uploads.id')
    })
}

exports.down = function (knex) {
  return knex.schema
    .dropTable('arpa_recipients')
}
