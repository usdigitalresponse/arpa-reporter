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
async function getAll () {
  return knex('reporting_periods')
    .select('*')
    .orderBy('end_date', 'desc')
}

/* getReportingPeriod() returns a record from the reporting_periods table.
  */
async function getReportingPeriod (period_id) {
  if (period_id && Number(period_id)) {
    return knex('reporting_periods')
      .select('*')
      .where('id', period_id)
      .then(r => r[0])
  } else if (period_id === undefined) {
    return knex('application_settings')
      .leftJoin('reporting_periods', 'application_settings.current_reporting_period_id', '=', 'reporting_periods.id')
      .select('reporting_periods.*')
      .then(r => r[0])
  } else {
    return null
  }
}

/* getFirstReportingPeriodStartDate() returns earliest start date
  */
async function getFirstReportingPeriodStartDate () {
  return knex('reporting_periods')
    .min('start_date')
    .then(r => r[0].min)
}

async function isClosed (period_id) {
  return getReportingPeriod(period_id)
    .then(period => {
      log(`period ${period_id} certified: ${Boolean(period.certified_at)}`)
      return Boolean(period.certified_at)
    })
}

/*  getPeriodID() returns the argument unchanged unless it is falsy, in which
  case it returns the current reporting period ID.
  */
async function getPeriodID (periodID) {
  return Number(periodID) || getCurrentReportingPeriodID()
}

/*  isCurrent() returns the current reporting period ID if the argument is
    falsy, or if it matches the current reporting period ID
  */
async function isCurrent (periodID) {
  const currentID = await getCurrentReportingPeriodID()

  if (!periodID || (Number(periodID) === Number(currentID))) {
    return currentID
  }
  return false
}

/* closeReportingPeriod()
  */
async function closeReportingPeriod (user, period) {
  const reporting_period_id = await getCurrentReportingPeriodID()

  period = period || reporting_period_id
  if (period !== reporting_period_id) {
    throw new Error(
      `The current reporting period (${reporting_period_id}) is not period ${period}`
    )
  }

  if (await isClosed(reporting_period_id)) {
    throw new Error(
      `Reporting period ${reporting_period_id} is already closed`
    )
  } else if (reporting_period_id > 1) {
    if (!(await isClosed(reporting_period_id - 1))) {
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

  await knex('reporting_periods')
    .where({ id: reporting_period_id })
    .update({
      certified_at: new Date().toISOString(),
      certified_by: user
    })

  await setCurrentReportingPeriod(reporting_period_id + 1)

  return null
}

/*  getEndDates()
  */
async function getEndDates () {
  return await knex('reporting_periods')
    .select('end_date')
    .orderBy('id')
}

/*  createReportingPeriod()
  */
async function createReportingPeriod (reportingPeriod) {
  return knex
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
function updateReportingPeriod (reportingPeriod) {
  return knex('reporting_periods')
    .where('id', reportingPeriod.id)
    .update({
      name: cleanString(reportingPeriod.name),
      start_date: reportingPeriod.start_date,
      end_date: reportingPeriod.end_date,
      period_of_performance_end_date: reportingPeriod.period_of_performance_end_date,
      crf_end_date: reportingPeriod.crf_end_date,
      reporting_template: reportingPeriod.reporting_template
    })
}

/*                                 *  *  *                                    */
