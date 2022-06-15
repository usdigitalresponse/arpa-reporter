
const knex = require('./connection')

function baseQuery (trns) {
  return trns('agencies')
    .select('*')
}

function agencies (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId to list agencies')
  }

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
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in agencyByCode')
  }
  if (code === undefined) {
    throw new Error('must specify code in agencyByCode')
  }

  return baseQuery(trns)
    .select('*')
    .where({ tenant_id: tenantId, code })
}

function createAgency (agency, trns = knex) {
  if (agency.tenant_id === undefined) {
    throw new Error('must specify tenantId to create new agency')
  }

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
