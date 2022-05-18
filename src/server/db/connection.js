const { DB_URL } = require('../environment')

console.log('\nConnecting to database:', DB_URL)
const knex = require('knex')({
  client: 'pg',
  connection: DB_URL,
  pool: {
    min: 0,
    idleTimeoutMillis: 10 * 60 * 1000 // minutes * seconds * milliseconds
  }
})

module.exports = knex
