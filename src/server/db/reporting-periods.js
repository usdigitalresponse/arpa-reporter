/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/reporting-periods.js
--------------------------------------------------------------------------------

  A reporting_periods record in postgres looks like this:

               Column             |           Type           |
  --------------------------------+--------------------------+
   id                             | integer                  |
   name                           | text                     |
   start_date                     | date                     |
   end_date                       | date                     |
   period_of_performance_end_date | date                     |
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
   validation_rule_tags           | text[]                   |
   open_date                      | date                     |
   close_date                     | date                     |
   review_period_start_date       | date                     |
   review_period_end_date         | date                     |
   final_report_file              | text                     |
*/
const knex = require('./connection')
const { log } = require('../lib/log')
const { cleanString } = require('../lib/spreadsheet')

const {
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
} = require('./settings')

module.exports = {
  get: getReportingPeriod,
  close: closeReportingPeriod,
  getEndDates: getEndDates,
  getFirstStartDate: getFirstReportingPeriodStartDate,

  getID: getPeriodID,
  isCurrent,
  isClosed,
  getAll,
  createReportingPeriod,
  updateReportingPeriod
}

/*  getAll() returns all the records from the reporting_periods table
  */
async function getAll (tenantId, trns = knex) {
  return trns('reporting_periods')
    .select('*')
    .where('tenant_id', tenantId)
    .orderBy('end_date', 'desc')
}

/* getReportingPeriod() returns a record from the reporting_periods table.
  */
async function getReportingPeriod (tenantId, period_id, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in getReportingPeriod')
  }

  if (period_id && Number(period_id)) {
    return trns('reporting_periods')
      .select('*')
      .where('id', period_id)
      .where('tenant_id', tenantId)
      .then(r => r[0])
  } else if (period_id === undefined) {
    return trns('application_settings')
      .where('application_settings.tenant_id', tenantId)
      .leftJoin('reporting_periods', 'application_settings.current_reporting_period_id', '=', 'reporting_periods.id')
      .select('reporting_periods.*')
      .then(r => r[0])
  } else {
    return null
  }
}

/* getFirstReportingPeriodStartDate() returns earliest start date
  */
async function getFirstReportingPeriodStartDate (tenantId, trns = knex) {
  return trns('reporting_periods')
    .where('tenant_id', tenantId)
    .min('start_date')
    .then(r => r[0].min)
}

async function isClosed (tenantId, period_id) {
  return getReportingPeriod(tenantId, period_id)
    .then(period => {
      log(`period ${period_id} certified: ${Boolean(period.certified_at)}`)
      return Boolean(period.certified_at)
    })
}

/*  getPeriodID() returns the argument unchanged unless it is falsy, in which
  case it returns the current reporting period ID.
  */
async function getPeriodID (tenantId, periodID) {
  return Number(periodID) || getCurrentReportingPeriodID(tenantId)
}

/*  isCurrent() returns the current reporting period ID if the argument is
    falsy, or if it matches the current reporting period ID
  */
async function isCurrent (tenantId, periodID) {
  const currentID = await getCurrentReportingPeriodID(tenantId)

  if (!periodID || (Number(periodID) === Number(currentID))) {
    return currentID
  }
  return false
}

/* closeReportingPeriod()
  */
async function closeReportingPeriod (user, period, trns = knex) {
  const reporting_period_id = await getCurrentReportingPeriodID(user.tenant_id, trns)

  period = period || reporting_period_id
  if (period !== reporting_period_id) {
    throw new Error(
      `The current reporting period (${reporting_period_id}) is not period ${period}`
    )
  }

  if (await isClosed(user.tenant_id, reporting_period_id)) {
    throw new Error(
      `Reporting period ${reporting_period_id} is already closed`
    )
  } else if (reporting_period_id > 1) {
    if (!(await isClosed(user.tenant_id, reporting_period_id - 1))) {
      throw new Error(
        `Prior reporting period ${reporting_period_id - 1} is not closed`
      )
    }
  }

  console.log(`closing period ${period}`)

  // TODO: Should we be writing summaries?  What are summaries used for?
  // const errLog = await writeSummaries(reporting_period_id)

  // if (errLog && errLog.length > 0) {
  //   console.dir(errLog, { depth: 4 })
  //   throw new Error(errLog[0])
  // }

  await trns('reporting_periods')
    .where({ id: reporting_period_id })
    .update({
      certified_at: new Date().toISOString(),
      // TODO(mbroussard): is this correct? We write a stringified json of user row?
      certified_by: user
    })

  await setCurrentReportingPeriod(user.tenant_id, reporting_period_id + 1)

  return null
}

/*  getEndDates()
  */
async function getEndDates (tenantId, trns = knex) {
  return await trns('reporting_periods')
    .where('tenant_id', tenantId)
    .select('end_date')
    .orderBy('id')
}

/*  createReportingPeriod()
  */
async function createReportingPeriod (reportingPeriod, trns = knex) {
  if (reportingPeriod.tenant_id === undefined) {
    throw new Error('createReportingPeriod caller must specify tenantId')
  }

  return trns
    .insert(reportingPeriod)
    .into('reporting_periods')
    .returning(['id'])
    .then(response => {
      return {
        ...reportingPeriod,
        id: response[0].id
      }
    })
}

/*  updateReportingPeriod()
  */
function updateReportingPeriod (reportingPeriod, trns = knex) {
  return trns('reporting_periods')
    .where('id', reportingPeriod.id)
    .update({
      name: cleanString(reportingPeriod.name),
      start_date: reportingPeriod.start_date,
      end_date: reportingPeriod.end_date,
      period_of_performance_end_date: reportingPeriod.period_of_performance_end_date,
      crf_end_date: reportingPeriod.crf_end_date,
      reporting_template: reportingPeriod.reporting_template
      // tenant_id is immutable
    })
}

/*                                 *  *  *                                    */
