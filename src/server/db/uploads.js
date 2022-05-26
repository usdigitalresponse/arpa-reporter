/* eslint camelcase: 0 */

const knex = require('./connection')
const {
  getCurrentReportingPeriodID
} = require('./settings')
const {agencyById} = require('./agencies');

async function listUploads ({ periodId, tenantId, agencyId = null, onlyValidated = false }, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in listUploads');
  }
  if (!periodId) {
    periodId = await getCurrentReportingPeriodID(tenantId, trns)
  }

  let query = trns('uploads')
    .leftJoin('users', 'uploads.user_id', 'users.id')
    .leftJoin('agencies', 'uploads.agency_id', 'agencies.id')
    .select('uploads.*', 'users.email AS created_by', 'agencies.code AS agency_code')
    .where({ reporting_period_id: periodId, tenant_id: tenantId })

  if (agencyId) {
    query = query.andWhere('uploads.agency_id', agencyId)
  }

  if (onlyValidated) {
    query = query.andWhere('uploads.validated_at IS NOT NULL')
  }

  return query.orderBy('uploads.created_at', 'desc')
}

async function uploadsForAgency (agency_id, period_id, trns = knex) {
  const agency = agencyById(agency_id, trns);
  if (!agency) {
    throw new Error('invalid agency in uploadsForAgency');
  }

  if (!period_id) {
    // TODO(mbroussard): should this pass trns?
    period_id = await getCurrentReportingPeriodID(agency.tenant_id)
  }

  return trns('uploads')
    .select('*')
    .where({ reporting_period_id: period_id })
    .andWhere('agency_id', agency_id)
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

function validForReportingPeriod (tenantId, period_id, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('tenant must be specified in validForReportingPeriod');
  }
  if (period_id === undefined) {
    throw new Error('period_id must be specified in validForReportingPeriod');
  }

  return trns.with('agency_max_val', trns.raw(`
    SELECT agency_id, ec_code, MAX(created_at)
    AS most_recent
    FROM uploads
    WHERE
      validated_at IS NOT NULL
      AND tenant_id = :tenantId
    GROUP BY agency_id, ec_code
  `, {tenantId}))
    .select('uploads.*')
    .from('uploads')
    .where('tenant_id', tenantId)
    .innerJoin('agency_max_val', function () {
      this.on('uploads.created_at', '=', 'agency_max_val.most_recent')
        .andOn('uploads.agency_id', '=', 'agency_max_val.agency_id')
        .andOn('uploads.ec_code', '=', 'agency_max_val.ec_code')
    })
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
function getUploadSummaries (tenantId, period_id, trns = knex) {
  // console.log(`period_id is ${period_id}`)
  return trns('uploads')
    .select('*')
    .where({'reporting_period_id': period_id, tenant_id: tenantId})
}

async function createUpload (upload, trns = knex) {
  if (upload.tenant_id === undefined) {
    throw new Error('must specify tenant when creating upload');
  }

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

async function getPeriodUploadIDs (tenantId, period_id, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in getPeriodUploadIDs');
  }

  if (!period_id) {
    // TODO(mbroussard): should this pass trns?
    period_id = await getCurrentReportingPeriodID(tenantId)
  }
  let rv
  try {
    rv = await trns('uploads')
      .select('id')
      .where({ reporting_period_id: period_id, tenant_id: tenantId })
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
  listUploads,
  uploadsForAgency,
  setAgencyId,
  setEcCode,
  markValidated,
  markNotValidated,
  validForReportingPeriod
}
