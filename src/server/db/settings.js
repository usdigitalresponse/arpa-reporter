const knex = require('./connection')

function setCurrentReportingPeriod (tenantId, id, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId')
  }
  if (id === undefined) {
    throw new Error('must specify id in setCurrentReportingPeriod')
  }

  return trns('application_settings')
    .where('tenant_id', tenantId)
    .update('current_reporting_period_id', id)
}

async function getCurrentReportingPeriodID (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId')
  }

  return trns('application_settings')
    .select('*')
    .where('tenant_id', tenantId)
    .then(r => r[0].current_reporting_period_id)
}

async function applicationSettings (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId')
  }

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
