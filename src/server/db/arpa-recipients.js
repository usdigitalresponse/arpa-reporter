const knex = require('./connection')

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

async function getRecipient (uei = null, tin = null, trns = knex) {
  const query = trns('arpa_recipients')
    .select(
      'arpa_recipients.*',
      'uploads.reporting_period_id AS reporting_period_id',
      'users.email AS created_by'
    )
    .leftJoin('uploads', 'arpa_recipients.upload_id', 'uploads.id')
    .leftJoin('users', 'uploads.user_id', 'users.id')

  if (uei) {
    query.where('uei', uei)
  } else if (tin) {
    query.where('tin', tin)
  } else {
    return null
  }

  return query.then(rows => rows[0])
}

async function listRecipients (trns = knex) {
  return trns('arpa_recipients AS r')
    .leftJoin('uploads AS u', 'r.upload_id', 'u.id')
    .select('r.*', 'u.reporting_period_id AS reporting_period_id')
}

module.exports = {
  createRecipient,
  getRecipient,
  updateRecipient,
  listRecipients
}
