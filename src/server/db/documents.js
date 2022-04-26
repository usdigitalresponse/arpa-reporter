/* eslint camelcase: 0 */

/*
  The columns in the postgres document table are:
    id
    type - the spreadsheet tab name
    content - json-coded row contents
    created_at
    upload_id
    last_updated_at
    last_updated_by
    user_id

  List them with
    $ psql ohio postgres
    ohio=# \d documents

  */
const knex = require('./connection')

const {
  getPeriodUploadIDs
} = require('./uploads')

function purgeDuplicateSubrecipients (arrRecords) {
  const arrRecordsOut = []
  const isDuplicate = {}

  arrRecords.forEach(record => {
    switch (record.type) {
      case 'subrecipient': {
        // TODO - as of 20 12 01 we are not putting duplicate records into
        // the database, but many are already in there, so we need this
        // until we purge the database.
        const id = String(
          record.content['duns number'] ||
          record.content['identification number'] ||
          ''
        )
        if (isDuplicate[id]) {
          return
        } else {
          record.content.zip = String(record.content.zip)
          record.content['identification number'] = id
          isDuplicate[id] = true
        }
        break
      }
      default:
        break
    }
    arrRecordsOut.push(record)
  })

  return arrRecordsOut
}

async function documents (period_id) {
  console.log('documents()')
  const periodUploadIDs = await getPeriodUploadIDs(period_id)

  return knex('documents')
    .select('*')
    .whereIn('upload_id', periodUploadIDs)
    .then(purgeDuplicateSubrecipients)
}

async function documentsOfType (type, period_id) {
  console.log('documentsOfType()')
  const periodUploadIDs = await getPeriodUploadIDs(period_id)

  return knex('documents')
    .select('*')
    .whereIn('upload_id', periodUploadIDs)
    .where('type', type)
}

async function documentsForAgency (agency_id, period_id) {
  console.log('documentsForAgency()')
  const periodUploadIDs = await getPeriodUploadIDs(period_id)

  let docs
  try {
    docs = await knex('documents')
      .select('documents.*')
      .whereIn('upload_id', periodUploadIDs)
      .join('uploads', { 'documents.upload_id': 'uploads.id' })
      .join('users', { 'documents.user_id': 'users.id' })
      .where('users.agency_id', agency_id)
  } catch (err) {
    console.dir(err)
  }
  return docs
}

async function documentsForUpload (uploadId) {
  return knex('documents')
    .select('*')
    .where('upload_id', uploadId)
}

function createDocument (document) {
  const created = knex
    .insert(document)
    .into('documents')
    .returning('*')
    .then(rows => rows[0])

  return created
}

function createDocuments (documents, queryBuilder = knex) {
  return queryBuilder.insert(documents).into('documents').returning('*')
}

module.exports = {
  createDocument,
  createDocuments,
  documents,
  documentsForAgency,
  documentsOfType,
  documentsForUpload
}
