/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.dropTable('documents')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.createTable('documents', function (table) {
    table.increments('id').primary()
    table.text('type').notNullable()
    table.json('content').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.integer('upload_id')
    table.timestamp('last_updated_at')
    table.string('last_updated_by')
  })
}
