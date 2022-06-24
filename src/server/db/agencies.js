
const knex = require('./connection')
const { requiredArgument } = require('../lib/preconditions')

function baseQuery (trns) {
  return trns('agencies')
    .select('*')
}

function agencies (tenantId, trns = knex) {
  requiredArgument(tenantId, 'must specify tenantId to list agencies')

  return baseQuery(trns)
    .where('tenant_id', tenantId)
    .orderBy('name')
}

function agencyById (id, trns = knex) {
  return baseQuery(trns)
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (tenantId, code, trns = knex) {
  requiredArgument(tenantId, 'must specify tenantId in agencyByCode')
  requiredArgument(code, 'must specify code in agencyByCode')

  return baseQuery(trns)
    .select('*')
    .where({ tenant_id: tenantId, code })
}

function createAgency (agency, trns = knex) {
  requiredArgument(agency.tenant_id, 'must specify tenantId to create new agency')

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
