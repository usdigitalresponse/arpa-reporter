/* eslint camelcase: 0 */

const knex = require('./connection')
const _ = require('lodash')
const {
  getCurrentReportingPeriodID
} = require('./settings')

async function uploads (period_id) {
  if (!period_id) {
    console.log('uploads()')
    period_id = await getCurrentReportingPeriodID()
  }
  return knex('uploads')
    .select('*')
    .where({ reporting_period_id: period_id })
    .orderBy('uploads.created_at', 'desc')
}

async function uploadsForAgency (agency_id, period_id) {
  if (!period_id) {
    console.log('uploadsForAgency()')
    period_id = await getCurrentReportingPeriodID()
  }

  return knex('uploads')
    .select('*')
    .where({ reporting_period_id: period_id })
    .andWhere('agency_id', agency_id)
    .orderBy('created_at', 'desc')
}

function upload (id) {
  return knex('uploads')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

/*  getUploadSummaries() returns a knex promise containing an array of
    records like this:
    {
      id: 1,
      filename: 'DOA-076-093020-v1.xlsx',
      created_at: 2020-11-19T15:14:34.481Z,
      created_by: 'michael+admin@stanford.cc',
      reporting_period_id: 1,
      user_id: 1,
      agency_id: 3,
      project_id: 48
    }
    */
function getUploadSummaries (period_id) {
  // console.log(`period_id is ${period_id}`)
  return knex('uploads')
    .select('*')
    .where('reporting_period_id', period_id)
}

async function createUpload (upload, queryBuilder = knex) {
  const inserted = await queryBuilder('uploads')
    .insert(upload)
    .returning('*')
    .then(rows => rows[0])

  return inserted
}

async function getPeriodUploadIDs (period_id) {
  if (!period_id) {
    period_id = await getCurrentReportingPeriodID()
  }
  let rv
  try {
    rv = await knex('uploads')
      .select('id')
      .where({ reporting_period_id: period_id })
      .then(recs => recs.map(rec => rec.id))
  } catch (err) {
    console.log('knex threw in getPeriodUploadIDs()!')
    console.dir(err)
  }
  return rv
}

module.exports = {
  getPeriodUploadIDs,
  getUploadSummaries,
  createUpload,
  upload,
  uploads,
  uploadsForAgency
}
