const db = process.env.POSTGRES_URL

console.log('\nConnecting to database:', db)
const knex = require('knex')({
  client: 'pg',
  connection: db,
  pool: {
    min: 0,
    idleTimeoutMillis: 10 * 60 * 1000 // minutes * seconds * milliseconds
  }
})

module.exports = knex
