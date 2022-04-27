/* eslint camelcase: 0 */

const knex = require('./connection')
const {
  getCurrentReportingPeriodID
} = require('./settings')

async function uploads (period_id) {
  if (!period_id) {
    console.log('uploads()')
    period_id = await getCurrentReportingPeriodID()
  }
  return knex('uploads')
    .leftJoin('users', 'uploads.user_id', 'users.id')
    .select('uploads.*', 'users.email as created_by')
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
    .leftJoin('users', 'uploads.user_id', 'users.id')
    .leftJoin('users AS vusers', 'uploads.validated_by', 'vusers.id')
    .leftJoin('agencies', 'uploads.agency_id', 'agencies.id')
    .select('uploads.*', 'users.email AS created_by', 'agencies.code AS agency_code', 'vusers.email AS validated_by_email')
    .where('uploads.id', id)
    .then(r => r[0])
}

/*  getUploadSummaries() returns a knex promise containing an array of
    records like this:
    {
      id: 1,
      filename: 'DOA-076-093020-v1.xlsx',
      created_at: 2020-11-19T15:14:34.481Z,
      reporting_period_id: 1,
      user_id: 1,
      agency_id: 3,
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

async function setAgencyId (uploadId, agencyId) {
  return knex('uploads')
    .where('id', uploadId)
    .update({ agency_id: agencyId })
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

async function markValidated (uploadId, userId) {
  return knex('uploads')
    .where('id', uploadId)
    .update({
      validated_at: knex.fn.now(),
      validated_by: userId
    })
    .returning('*')
    .then(rows => rows[0])
}

async function markNotValidated (uploadId) {
  return knex('uploads')
    .where('id', uploadId)
    .update({
      validated_at: null,
      validated_by: null
    })
    .returning('*')
    .then(rows => rows[0])
}
module.exports = {
  getPeriodUploadIDs,
  getUploadSummaries,
  createUpload,
  upload,
  uploads,
  uploadsForAgency,
  setAgencyId,
  markValidated,
  markNotValidated
}
