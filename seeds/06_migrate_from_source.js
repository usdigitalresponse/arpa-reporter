require('dotenv').config()

exports.seed = async function (knex) {
  if (!process.env.POSTGRES_SOURCE_URL) {
    console.log('POSTGRES_SOURCE_URL is not specified, so nothing to do')
    return
  }

  const sourcedb = require('knex')(process.env.POSTGRES_SOURCE_URL)
  const sourceAgencies = await sourcedb('agencies').select()
  const existingAgencies = await knex('agencies').select()

  // figure out which to insert
  const newAgencies = []
  sourceAgencies.forEach(source => {
    const matching = existingAgencies.filter(existing => (existing.code === source.code))
    if (matching.length !== 1) {
      newAgencies.push(
        { name: source.name, code: source.code }
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
  const curAgencies = await knex('agencies').select()
  const sourceToCur = {}
  sourceAgencies.forEach(source => {
    const matching = curAgencies.filter(cur => (cur.code === source.code))[0]
    sourceToCur[source.id] = matching.id
  })

  // now users
  const sourceUsers = await sourcedb('users').select()
  const existingUsers = await knex('users').select()

  // which to insert?
  const newUsers = []
  sourceUsers.forEach(source => {
    const matching = existingUsers.filter(existing => (existing.email === source.email))
    if (matching.length !== 1) {
      const agencyId = source.agency_id ? sourceToCur[source.agency_id] : null
      newUsers.push(
        { email: source.email, name: source.name, role: source.role, tags: source.tags, agency_id: agencyId }
      )
    }
  })

  // insert, if necessary
  if (newUsers.length) {
    console.log(`creating ${newUsers.length} new users`)
    return knex('users')
      .insert(newUsers)
  }
}
