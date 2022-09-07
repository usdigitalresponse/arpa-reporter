const setupAgencies = async knex => {
  // We check if a "tenants" table exists to tell if we're running under GOST or in the legacy arpa-reporter
  // repo.
  const tenantsTable = await knex('pg_tables')
    .where({ schemaname: 'public', tablename: 'tenants' })
    .select('tablename')
  const isGost = tenantsTable.length !== 0

  return knex('agencies').insert([
    { id: 1, name: 'Generic Government', code: 'GOV', tenant_id: 0 },
    { id: 2, name: 'Office of Management and Budget', code: 'OMB', tenant_id: 0 },
    { id: 3, name: 'Department of Health', code: 'DOH', tenant_id: 0 },
    { id: 4, name: 'Executive Office of Health and Human Services', code: 'EOHHS', tenant_id: 0 }
  ].map(
    // GOST has a non-null main_agency_id field on agencies that legacy arpa-reporter does not have
    row => isGost ? ({ ...row, main_agency_id: row.id }) : row
  )).then(() => {
    return 'Agency data added OK'
  })
}

module.exports = {
  setupAgencies
}

// Run this file directly through node to set up dummy data for manual testing.
if (require.main === module) {
  require('dotenv').config()
  const knex = require('../../../src/server/db/connection')
  setupAgencies(knex).then(() => {
    knex.destroy()
  })
}
