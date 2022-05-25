
const knex = require('./connection')

function agencies (trns = knex) {
  return trns('agencies')
    .select('*')
    .orderBy('name')
}

function agencyById (id, trns = knex) {
  return trns('agencies')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (code, trns = knex) {
  return trns('agencies')
    .select('*')
    .where({ code })
}

function createAgency (agency, trns = knex) {
  return trns
    .insert(agency)
    .into('agencies')
    .returning(['id'])
    .then(response => {
      return {
        ...agency,
        id: response[0].id
      }
    })
}

function updateAgency (agency, trns = knex) {
  return trns('agencies')
    .where('id', agency.id)
    .update({
      code: agency.code,
      name: agency.name
    })
}

module.exports = {
  agencies,
  agencyById,
  agencyByCode,
  createAgency,
  updateAgency
}
