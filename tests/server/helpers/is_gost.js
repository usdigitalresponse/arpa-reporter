
async function isRunningInGOST (knex) {
  // We check if a "tenants" table exists to tell if we're running under GOST or in the legacy arpa-reporter
  // repo.
  const tenantsTable = await knex('pg_tables')
    .where({ schemaname: 'public', tablename: 'tenants' })
    .select('tablename')
  return tenantsTable.length !== 0
}

module.exports = { isRunningInGOST }
