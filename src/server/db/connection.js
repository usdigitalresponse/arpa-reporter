const { types } = require('pg')
const { POSTGRES_URL } = require('../environment')

console.log('\nConnecting to database:', POSTGRES_URL)

// override parser for date fields — just return the raw string content
const DATE_OID = 1082
types.setTypeParser(DATE_OID, value => value)

const knex = require('knex')({
  client: 'pg',
  connection: POSTGRES_URL,
  pool: {
    min: 0,
    idleTimeoutMillis: 10 * 60 * 1000 // minutes * seconds * milliseconds
  }
})

module.exports = knex
