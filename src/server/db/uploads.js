/* eslint camelcase: 0 */

const knex = require('./connection')
const {
  getCurrentReportingPeriodID
} = require('./settings')

function baseQuery (trns) {
  return trns('uploads')
    .leftJoin('users', 'uploads.user_id', 'users.id')
    .leftJoin('agencies', 'uploads.agency_id', 'agencies.id')
    .select('uploads.*', 'users.email AS created_by', 'agencies.code AS agency_code')
}

async function uploadsInPeriod (periodId, trns = knex) {
  if (!periodId) {
    periodId = await getCurrentReportingPeriodID(trns)
  }

  return baseQuery(trns)
    .where('reporting_period_id', periodId)
    .orderBy('uploads.created_at', 'desc')
}

async function uploadsInSeries (upload, trns = knex) {
  return baseQuery(trns)
    .where('reporting_period_id', upload.reporting_period_id)
    .andWhere('uploads.agency_id', upload.agency_id)
    .andWhere('uploads.ec_code', upload.ec_code)
    .orderBy('created_at', 'desc')
}

function getUpload (id, trns = knex) {
  return trns('uploads')
    .leftJoin('users', 'uploads.user_id', 'users.id')
    .leftJoin('users AS vusers', 'uploads.validated_by', 'vusers.id')
    .leftJoin('agencies', 'uploads.agency_id', 'agencies.id')
    .select('uploads.*', 'users.email AS created_by', 'agencies.code AS agency_code', 'vusers.email AS validated_by_email')
    .where('uploads.id', id)
    .then(r => r[0])
}

function usedForTreasuryExport (periodId, trns = knex) {
  return baseQuery(trns)
    .with('agency_max_val', trns.raw(
      'SELECT agency_id, ec_code, reporting_period_id, MAX(created_at) AS most_recent ' +
      'FROM uploads WHERE validated_at IS NOT NULL ' +
      'GROUP BY agency_id, ec_code, reporting_period_id'
    ))
    .where('uploads.reporting_period_id', periodId)
    .innerJoin('agency_max_val', function () {
      this.on('uploads.created_at', '=', 'agency_max_val.most_recent')
        .andOn('uploads.agency_id', '=', 'agency_max_val.agency_id')
        .andOn('uploads.ec_code', '=', 'agency_max_val.ec_code')
        .andOn('uploads.reporting_period_id', '=', 'agency_max_val.reporting_period_id')
    })
}

/*  getUploadSummaries() returns a trns promise containing an array of
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
function getUploadSummaries (period_id, trns = knex) {
  // console.log(`period_id is ${period_id}`)
  return trns('uploads')
    .select('*')
    .where('reporting_period_id', period_id)
}

async function createUpload (upload, trns = knex) {
  const inserted = await trns('uploads')
    .insert(upload)
    .returning('*')
    .then(rows => rows[0])

  return inserted
}

async function setAgencyId (uploadId, agencyId, trns = knex) {
  return trns('uploads')
    .where('id', uploadId)
    .update({ agency_id: agencyId })
}

async function setEcCode (uploadId, ecCode, trns = knex) {
  return trns('uploads')
    .where('id', uploadId)
    .update({ ec_code: ecCode })
}

async function getPeriodUploadIDs (period_id, trns = knex) {
  if (!period_id) {
    period_id = await getCurrentReportingPeriodID()
  }
  let rv
  try {
    rv = await trns('uploads')
      .select('id')
      .where({ reporting_period_id: period_id })
      .then(recs => recs.map(rec => rec.id))
  } catch (err) {
    console.log('trns threw in getPeriodUploadIDs()!')
    console.dir(err)
  }
  return rv
}

async function markValidated (uploadId, userId, trns = knex) {
  return trns('uploads')
    .where('id', uploadId)
    .update({
      validated_at: trns.fn.now(),
      validated_by: userId
    })
    .returning('*')
    .then(rows => rows[0])
}

async function markNotValidated (uploadId, trns = knex) {
  return trns('uploads')
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
  getUpload,
  uploadsInPeriod,
  uploadsInSeries,
  setAgencyId,
  setEcCode,
  markValidated,
  markNotValidated,
  usedForTreasuryExport
}
