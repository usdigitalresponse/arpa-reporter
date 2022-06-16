require('dotenv').config()

const adminList = (process.env.INITIAL_ADMIN_EMAILS || '').split(/\s*,\s*/)
const agencyUserList = (process.env.INITIAL_AGENCY_EMAILS || '').split(
  /\s*,\s*/
)

const unitTestUsers = [
  {
    email: 'mbroussard+unit-test-admin@usdigitalresponse.org',
    name: 'Unit Test Admin 1',
    role: 'admin',
    tenant_id: 0
  }
]

exports.seed = async function (knex) {
  // Deletes ALL existing admins and reporters
  // TODO(mbroussard): moot since mocha_wrapper.sh deletes and recreates the DB?
  await knex('users')
    .where({ role: 'admin' })
    .del()
  await knex('users')
    .where({ role: 'reporter' })
    .del()

  // Fixed test users specified in this file
  await knex('users').insert(unitTestUsers)

  // Test users specified by environment variable
  // TODO(mbroussard): why does this exist if this seed is only used for tests?
  await knex('users').insert(
    adminList.map(email => {
      return { email, name: email, role: 'admin' }
    })
  )
  await knex('users').insert(
    agencyUserList.map(email => {
      return { email, name: email, role: 'reporter' }
    })
  )
}
