const { types } = require('pg')
const { builtins } = require('pg-types')
const { POSTGRES_URL } = require('../environment')

console.log('\nConnecting to database:', POSTGRES_URL)

// override parser for date fields — just return the raw string content
types.setTypeParser(builtins.DATE, value => value)

const knex = require('knex')({
  client: 'pg',
  connection: POSTGRES_URL,
  pool: {
    min: 0,
    idleTimeoutMillis: 10 * 60 * 1000 // minutes * seconds * milliseconds
  }
})

module.exports = knex
