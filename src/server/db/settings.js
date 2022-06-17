const knex = require('./connection')

function setCurrentReportingPeriod (id, trns = knex) {
  return trns('application_settings')
    .update('current_reporting_period_id', id)
}

async function getCurrentReportingPeriodID (trns = knex) {
  return trns('application_settings')
    .select('*')
    .then(r => r[0].current_reporting_period_id)
}

async function applicationSettings (trns = knex) {
  return await trns('application_settings')
    .join(
      'reporting_periods',
      'application_settings.current_reporting_period_id',
      'reporting_periods.id'
    )
    .select('*')
    .then(rows => rows[0])
}

module.exports = {
  applicationSettings,
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
}
