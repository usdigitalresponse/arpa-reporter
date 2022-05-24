
const knex = require('./connection')

function agencies (tenantId, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId to list agencies');
  }

  return trns('agencies')
    .select('*')
    .where('tenant_id', tenantId)
    .orderBy('name')
}

function agencyById (id, trns = knex) {
  return trns('agencies')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

function agencyByCode (tenantId, code, trns = knex) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in agencyByCode');
  }
  if (code === undefined) {
    throw new Error('must specify code in agencyByCode');
  }

  return trns('agencies')
    .select('*')
    .where({ tenant_id: tenantId, code })
}

function createAgency (agency, trns = knex) {
  if (agency.tenant_id === undefined) {
    throw new Error('must specify tenantId to create new agency');
  }

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
