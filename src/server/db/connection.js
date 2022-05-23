const { POSTGRES_URL } = require('../environment')

console.log('\nConnecting to database:', POSTGRES_URL)
const knex = require('knex')({
  client: 'pg',
  connection: POSTGRES_URL,
  pool: {
    min: 0,
    idleTimeoutMillis: 10 * 60 * 1000 // minutes * seconds * milliseconds
  }
})

module.exports = knex
