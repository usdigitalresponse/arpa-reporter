
const knex = require('./connection')

function baseQuery (trns) {
  return trns('agencies')
    .select('*')
}

function agencies (trns = knex) {
  return baseQuery(trns)
    .orderBy('name')
}

function agencyById (id, trns = knex) {
  return baseQuery(trns)
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (code, trns = knex) {
  return baseQuery(trns)
    .select('*')
    .where({ code })
}

function createAgency (agency, trns = knex) {
  return trns
    .insert(agency)
    .into('agencies')
    .returning('*')
    .then(r => r[0])
}

function updateAgency (agency, trns = knex) {
  return trns('agencies')
    .where('id', agency.id)
    .update({
      code: agency.code,
      name: agency.name
    })
    .returning('*')
    .then(r => r[0])
}

module.exports = {
  agencies,
  agencyById,
  agencyByCode,
  createAgency,
  updateAgency
}
