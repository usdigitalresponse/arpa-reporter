const knex = require('./connection')

// tenantId -> currentReportingPeriodID
let currentReportingPeriodIDCache = {};

// setCurrentReportingPeriod()
function setCurrentReportingPeriod (tenantId, id, trns = knex) {
  currentReportingPeriodIDCache[tenantId] = id
  return trns('application_settings')
    .where('tenantId', tenantId)
    .update('current_reporting_period_id', id)
}

// update application_settings set current_reporting_period_id=1;
async function getCurrentReportingPeriodID (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId');
  }

  if (currentReportingPeriodIDCache[tenantId] !== undefined) {
    return currentReportingPeriodIDCache[tenantId]
  }

  let crpID
  try {
    crpID = await trns('application_settings')
      .select('*')
      .where('tenant_id', tenantId)
      .then(r => {
        const id = r[0].current_reporting_period_id
        currentReportingPeriodIDCache[tenantId] = id
        return id
      })
  } catch (err) {
    console.dir(err)
    return err
  }
  return crpID
}

/*  applicationSettings() returns
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    duns_number: '809031776'
  }
  */
function applicationSettings (tenantId) {
  return currentReportingPeriodSettings(tenantId)
}

/* currentReportingPeriodSettings() returns:
  {
    title: 'Ohio',
    current_reporting_period_id: 1,
    duns_number: '809031776',
    id: 1,
    name: 'September 2020',
    start_date: 2020-03-01T06:00:00.000Z,
    end_date: 2020-09-30T05:00:00.000Z,
    period_of_performance_end_date: 2020-12-30T06:00:00.000Z
  }

  reporting period record in db:
    id
    name
    start_date
    end_date
    period_of_performance_end_date
    certified_at
    certified_by
    reporting_template
    validation_rule_tags
 */
async function currentReportingPeriodSettings (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId');
  }

  let rv
  try {
    rv = await trns('application_settings')
      .where('application_settings.tenant_id', tenantId)
      .join(
        'reporting_periods',
        'application_settings.current_reporting_period_id',
        'reporting_periods.id'
      )
      .select('*')
      .then(rv => rv[0])
  } catch (err) {
    console.dir(err)
  }
  return rv
}

module.exports = {
  applicationSettings,
  currentReportingPeriodSettings,
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
}

/*                                 *  *  *                                    */
