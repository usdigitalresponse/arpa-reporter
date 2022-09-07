
// This seed exists for compatibility between both the legacy arpa-reporter repo and ARPA Reporter tests
// running within GOST. In GOST, there is a separate tenants table with FKs to it, so the latter seeds
// fail if there is not already a row in the tenants table.
exports.seed = async function (knex) {
  const rows = await knex('pg_tables')
    .where({ schemaname: 'public', tablename: 'tenants' })
    .select('tablename')
  if (rows.length === 0) {
    return
  } else {
    console.error('!!!!', rows)
  }

  await knex('tenants').insert([
    {
      id: 0,
      display_name: 'Tenant 0 for ARPA Reporter unit tests'
    },
    {
      id: 1,
      display_name: 'Tenant 1 for ARPA Reporter unit tests'
    }
  ])
}