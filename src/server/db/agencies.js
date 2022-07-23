
const knex = require('./connection')
const { requiredArgument } = require('../lib/preconditions')
const { useTenantId } = require('../use-request')

function baseQuery (trns) {
  return trns('agencies')
    .select('*')
}

function agencies (trns = knex) {
  const tenantId = useTenantId()

  return baseQuery(trns)
    .where('tenant_id', tenantId)
    .orderBy('name')
}

function agencyById (id, trns = knex) {
  return baseQuery(trns)
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (code, trns = knex) {
  requiredArgument(code, 'must specify code in agencyByCode')
  const tenantId = useTenantId()

  return baseQuery(trns)
    .select('*')
    .where({ tenant_id: tenantId, code })
}

function createAgency (agency, trns = knex) {
  const tenantId = useTenantId()

  return trns
    .insert({ ...agency, tenant_id: tenantId })
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
