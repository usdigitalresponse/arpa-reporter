
exports.seed = async function (knex) {
  // in ARPA repo there is no tenants table, just IDs (idea is to use GOST's
  // tenant table when merged in)

  const firstUser = await knex('users')
    .where('email', 'mbroussard+bugbash-tenant1-agencya-admin@usdigitalresponse.org')
    .select('*')
    .then(x => x[0]);

  const tenantIds = [1, 2, 3];
  if (!firstUser) {
    for (const tenantId of tenantIds) {
      for (const [agencyName] of ['A', 'B']) {
        const agency = await knex('agencies').insert({
          tenant_id: tenantId,
          name: `Bugbash Test Agency ${agencyName}`,
          code: agencyName,
        }).returning('*');

        for (const role of ['admin', 'reporter']) {
          const email = `mbroussard+bugbash-tenant${tenantId}-agency${agencyName}-${role}@usdigitalresponse.org`.toLowerCase();
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
  } else {
    console.log('already have users, skipping');
  }

  const reportingPeriods = await knex('reporting_periods').where('tenant_id', 0).select('*');
  const appSettings = await knex('application_settings').where('tenant_id', 0).select('*');

  for (const tenantId of tenantIds) {
    const insertedPeriods = await knex('reporting_periods').insert(reportingPeriods.map(period => {
      delete period['id'];
      return {...period, tenant_id: tenantId};
    })).returning('*');

    await knex('application_settings').insert(appSettings.map(settings => {
      return {...settings, tenant_id: tenantId, current_reporting_period_id: insertedPeriods[0].id};
    }));
  }
}
