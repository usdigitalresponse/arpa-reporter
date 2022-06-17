
exports.seed = async function (knex) {
  // in ARPA repo there is no tenants table, just IDs (idea is to use GOST's
  // tenant table when merged in)
  for (const tenantId of [1, 2, 3]) {
    for (const [agencyName] of ['A', 'B']) {
      const agency = await knex('agencies').insert({
        tenant_id: tenantId,
        name: `Bugbash Test Agency ${agencyName}`,
        code: agencyName,
      }).returning('*');

      for (const role of ['admin', 'reporter']) {
        const email = `mbroussard+bugbash-tenant${tenantId}-agency${agencyName}-${role}@usdigitalresponse.org`;
        console.log(email);

        const user = await knex('users').insert({
          email,
          name: `Bugbash Test: ${tenantId}/${agencyName}/${role}`,
          role,
          agency_id: agency.id,
          tenant_id: tenantId
        }).returning('*');
      }
    }
  }
}
