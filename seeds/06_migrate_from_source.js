require('dotenv').config()

// NOTE(mbroussard): unclear to me if this seed will be used again, but I'm updating it to minimally
// support tenantId so that it doesn't fail if we remove the default value on tenantId column. It
// assumes the source DB is all one tenant and ignores tenantIds in the source. Everything gets the
// same tenantId in the destination DB.

exports.seed = async function (knex, destinationTenantId = 0) {
  if (!process.env.POSTGRES_SOURCE_URL) {
    console.log('POSTGRES_SOURCE_URL is not specified, so nothing to do')
    return
  }

  const sourcedb = require('knex')(process.env.POSTGRES_SOURCE_URL)
  const sourceAgencies = await sourcedb('agencies').select()
  const existingAgencies = await knex('agencies').select().where('tenant_id', destinationTenantId)

  // figure out which to insert
  const newAgencies = []
  sourceAgencies.forEach(source => {
    const matching = existingAgencies.filter(existing => (existing.code === source.code))
    if (matching.length !== 1) {
      newAgencies.push(
        { name: source.name, code: source.code, tenant_id: destinationTenantId }
      )
    }
  })

  // insert, if necessary
  if (newAgencies.length) {
    console.log(`creating ${newAgencies.length} new agencies`)
    await knex('agencies')
      .insert(newAgencies)
  }

  // build mapping from agency id at the source to agency id in the current db
  const curAgencies = await knex('agencies').select().where('tenant_id', destinationTenantId)
  const sourceToCur = {}
  sourceAgencies.forEach(source => {
    const matching = curAgencies.filter(cur => (cur.code === source.code))[0]
    sourceToCur[source.id] = matching.id
  })

  // now users
  const sourceAll = await sourcedb('users').select()
  const sourceAdmins = sourceAll.filter(user => user.role === 'admin')
  const existingUsers = await knex('users').select()

  // which to insert?
  const sourceUsers = sourceAdmins // only add admins for now
  const newUsers = []
  sourceUsers.forEach(source => {
    const matching = existingUsers.filter(existing => (existing.email === source.email))
    if (matching.length === 0) {
      const agencyId = source.agency_id ? sourceToCur[source.agency_id] : null
      newUsers.push(
        { email: source.email, name: source.name, role: source.role, tags: source.tags, agency_id: agencyId, tenant_id: destinationTenantId }
      )
    } else if (matching.length === 1) {
      // Sanity check: existing user we match to should be in same tenant; we don't do this filter
      // at SQL level because users must have globally unique (across tenants) email addresses
      if (matching[0].tenant_id !== destinationTenantId) {
        throw new Error(`User ${source.email} already exists in tenant ${matching[0].tenant_id}, but specified destinationTenantId=${destinationTenantId}`)
      }
    } else {
      throw new Error('should be impossible: multiple existing users with same email')
    }
  })

  // insert, if necessary
  if (newUsers.length) {
    console.log(`creating ${newUsers.length} new users`)
    return knex('users')
      .insert(newUsers)
  }
}
