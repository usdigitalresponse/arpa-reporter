
const knex = require('./connection')

function agencies () {
  return knex('agencies')
    .select('*')
    .orderBy('name')
}

function agencyById (id) {
  return knex('agencies')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (code) {
  return knex('agencies')
    .select('*')
    .where({ code })
}

function createAgency (agency) {
  return knex
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

function updateAgency (agency) {
  return knex('agencies')
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
