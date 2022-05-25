const knex = require('./connection')

function baseQuery (trns) {
  return trns('arpa_recipients')
    .select(
      'arpa_recipients.*',
      'uploads.reporting_period_id AS reporting_period_id',
      'users.email AS created_by'
    )
    .leftJoin('uploads', 'arpa_recipients.upload_id', 'uploads.id')
    .leftJoin('users', 'uploads.user_id', 'users.id')
}

async function createRecipient (recipient, trns = knex) {
  if (!(recipient.uei || recipient.tin)) {
    throw new Error('recipient row must include a `uei` or a `tin` field')
  }

  return trns('arpa_recipients')
    .insert(recipient)
    .returning('*')
    .then(rows => rows[0])
}

async function updateRecipient ({ uei, tin, record }, trns = knex) {
  if (!(uei || tin)) {
    throw new Error('recipient row must include a `uei` or a `tin` field')
  }
  const query = trns('arpa_recipients')
    .update('record', record)
    .returning('*')

  if (uei) {
    query.where('uei', uei)
  } else if (tin) {
    query.where('tin', tin)
  }

  return query.then(rows => rows[0])
}

async function getRecipient (id, trns = knex) {
  return baseQuery(trns)
    .where('arpa_recipients.id', id)
    .then(rows => rows[0])
}

async function findRecipient (uei = null, tin = null, trns = knex) {
  const query = baseQuery(trns)

  if (uei) {
    query.where('arpa_recipients.uei', uei)
  } else if (tin) {
    query.where('arpa_recipients.tin', tin)
  } else {
    return null
  }

  return query.then(rows => rows[0])
}

async function listRecipients (trns = knex) {
  return baseQuery(trns)
}

module.exports = {
  createRecipient,
  getRecipient,
  findRecipient,
  updateRecipient,
  listRecipients
}
