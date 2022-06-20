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
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
*/
const knex = require('./connection')
const { cleanString } = require('../lib/spreadsheet')

const {
  getCurrentReportingPeriodID,
  setCurrentReportingPeriod
} = require('./settings')

module.exports = {
  getReportingPeriod,
  closeReportingPeriod,
  getReportingPeriodID,
  getAllReportingPeriods,
  createReportingPeriod,
  updateReportingPeriod
}

function baseQuery (trns) {
  return trns('reporting_periods')
    .select(
      'reporting_periods.*',
      'users.email AS certified_by_email'
    )
    .leftJoin('users', 'reporting_periods.certified_by', 'users.id')
}

async function getAllReportingPeriods (trns = knex) {
  return baseQuery(trns).orderBy('end_date', 'desc')
}

/* getReportingPeriod() returns a record from the reporting_periods table.
  */
async function getReportingPeriod (period_id, trns = knex) {
  if (period_id && Number(period_id)) {
    return baseQuery(trns)
      .where('reporting_periods.id', period_id)
      .then(r => r[0])
  } else if (period_id === undefined) {
    return baseQuery(trns)
      .innerJoin('application_settings', 'reporting_periods.id', 'application_settings.current_reporting_period_id')
      .then(r => r[0])
  } else {
    return null
  }
}

/*  getPeriodID() returns the argument unchanged unless it is falsy, in which
  case it returns the current reporting period ID.
  */
async function getReportingPeriodID (periodID) {
  return Number(periodID) || getCurrentReportingPeriodID()
}

async function closeReportingPeriod (user, period, trns = knex) {
  const currentPeriodID = await getCurrentReportingPeriodID(trns)

  if (period.id !== currentPeriodID) {
    throw new Error(
      `Cannot close period ${period.name} -- it is not the current reporting period`
    )
  }

  if (period.certified_at) {
    throw new Error(
      `Reporting period ${period.id} is already closed`
    )
  }

  const prior = await trns('reporting_periods')
    .where('start_date', '<', period.start_date)
    .orderBy('start_date', 'desc')
    .limit(1)
    .then(rows => rows[0])
  if (prior && !prior.certified_at) {
    throw new Error(
      `Prior reporting period (${prior.name}) is not closed`
    )
  }

  console.log(`closing period ${period}`)

  // TODO: Should we be writing summaries?  What are summaries used for?
  // const errLog = await writeSummaries(reporting_period_id)

  // if (errLog && errLog.length > 0) {
  //   console.dir(errLog, { depth: 4 })
  //   throw new Error(errLog[0])
  // }

  await trns('reporting_periods')
    .where({ id: period.id })
    .update({
      certified_at: knex.fn.now(),
      certified_by: user.id
    })

  const next = await trns('reporting_periods')
    .where('start_date', '>', period.start_date)
    .orderBy('start_date', 'asc')
    .limit(1)
    .then(rows => rows[0])

  await setCurrentReportingPeriod(next.id, trns)
}

async function createReportingPeriod (reportingPeriod, trns = knex) {
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

function updateReportingPeriod (reportingPeriod, trns = knex) {
  return trns('reporting_periods')
    .where('id', reportingPeriod.id)
    .update({
      name: cleanString(reportingPeriod.name),
      start_date: reportingPeriod.start_date,
      end_date: reportingPeriod.end_date,
      template_filename: reportingPeriod.template_filename
    })
}

/*                                 *  *  *                                    */
