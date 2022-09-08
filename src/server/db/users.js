const { v4 } = require('uuid')

const knex = require('./connection')
const environment = require('../environment')
const { useTenantId } = require('../use-request')

// Takes the result of a users query joined on roles and formats the role object as a member, matching
// the format present in GOST.
function formatUserRole (row) {
  const role = {
    id: row.role_id,
    name: row.role_name,
    rules: row.role_rules
  }

  delete row.role
  delete row.role_id
  delete row.role_name
  delete row.role_rules
  row.role = role

  return row
}

async function users (trns = knex) {
  const tenantId = useTenantId()

  const rows = await trns('users')
    .join('roles', 'roles.name', 'users.role')
    .select(
      'users.*',
      'roles.name as role_name',
      'roles.rules as role_rules',
      'roles.id as role_id'
    )
    .where('users.tenant_id', tenantId)
    .orderBy('email')

  return rows.map(formatUserRole)
}

function createUser (user, trns = knex) {
  const tenantId = useTenantId()

  return trns('users')
    .insert({
      ...user,
      role: user.role.name,
      tenant_id: tenantId
    })
    .returning('*')
    .then(rows => rows[0])
}

function updateUser (user, trns = knex) {
  return trns('users')
    .where('id', user.id)
    .update({
      email: user.email,
      name: user.name,
      role: user.role.name,
      agency_id: user.agency_id
      // tenant_id is immutable
    })
    .returning('*')
    .then(rows => rows[0])
}

function user (id, trns = knex) {
  return userAndRole(id, trns)
}

async function userAndRole (id, trns = knex) {
  const row = await trns('users')
    .join('roles', 'roles.name', 'users.role')
    .select(
      'users.*',
      'roles.rules as role_rules',
      'roles.name as role_name',
      'roles.id as role_id'
    )
    .where('users.id', id)
    .then(r => r[0])

  return formatUserRole(row)
}

// NOTE(mbroussard): roles are currently global and shared across all tenants.
function roles (trns = knex) {
  return trns('roles')
    .select('*')
    .orderBy('name')
}

function accessToken (passcode, trns = knex) {
  return trns('access_tokens')
    .select('*')
    .where('passcode', passcode)
    .then(r => r[0])
}

function markAccessTokenUsed (passcode, trns = knex) {
  return trns('access_tokens')
    .where('passcode', passcode)
    .update({ used: true })
}

async function generatePasscode (email, trns = knex) {
  console.log('generatePasscode for :', email)
  const users = await trns('users')
    .select('*')
    .where('email', email)
  if (users.length === 0) {
    throw new Error(`User '${email}' not found`)
  }
  const passcode = v4()
  const used = false
  const expiryMinutes = environment.LOGIN_EXPIRY_MINUTES
  const expires = new Date()
  expires.setMinutes(expires.getMinutes() + expiryMinutes)
  await trns('access_tokens').insert({
    user_id: users[0].id,
    passcode,
    expires,
    used
  })
  return passcode
}

function createAccessToken (email) {
  return generatePasscode(email)
}

module.exports = {
  accessToken,
  createAccessToken,
  createUser,
  markAccessTokenUsed,
  roles,
  updateUser,
  user,
  userAndRole,
  users
}
