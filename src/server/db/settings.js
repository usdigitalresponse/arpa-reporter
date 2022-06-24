const knex = require('./connection')
const { requiredArgument } = require('../lib/preconditions')

function setCurrentReportingPeriod (tenantId, id, trns = knex) {
  requiredArgument(tenantId, 'must specify tenantId')
  requiredArgument(id, 'must specify id in setCurrentReportingPeriod')

  return trns('application_settings')
    .where('tenant_id', tenantId)
    .update('current_reporting_period_id', id)
}

async function getCurrentReportingPeriodID (tenantId, trns = knex) {
  requiredArgument(tenantId, 'must specify tenantId')

  return trns('application_settings')
    .select('*')
    .where('tenant_id', tenantId)
    .then(r => r[0].current_reporting_period_id)
}

async function applicationSettings (tenantId, trns = knex) {
  requiredArgument(tenantId, 'must specify tenantId')

  return await trns('application_settings')
    .join(
      'reporting_periods',
      'application_settings.current_reporting_period_id',
      'reporting_periods.id'
    )
    .select('*')
    .where('application_settings.tenant_id', tenantId)
    .then(rows => rows[0])
}

module.exports = {
  applicationSettings,
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
}
