const { v4 } = require('uuid')

const knex = require('./connection')
const environment = require('../environment')
const { useTenantId } = require('../use-request')

function users (trns = knex) {
  const tenantId = useTenantId()

  return trns('users')
    .leftJoin('agencies', 'users.agency_id', 'agencies.id')
    .select('users.*', 'agencies.name AS agency_name', 'agencies.code AS agency_code')
    .where('users.tenant_id', tenantId)
    .orderBy('email')
}

function createUser (user, trns = knex) {
  const tenantId = useTenantId()

  return trns('users')
    .insert({ ...user, tenant_id: tenantId })
    .returning('*')
    .then(rows => rows[0])
}

function updateUser (user, trns = knex) {
  return trns('users')
    .where('id', user.id)
    .update({
      email: user.email,
      name: user.name,
      role: user.role,
      agency_id: user.agency_id
      // tenant_id is immutable
    })
    .returning('*')
    .then(rows => rows[0])
}

function user (id, trns = knex) {
  return trns('users')
    .select('*')
    .where('id', id)
    .then(r => r[0])
}

function userAndRole (id, trns = knex) {
  return trns('users')
    .join('roles', 'roles.name', 'users.role')
    .select(
      'users.id',
      'users.email',
      'users.role',
      'users.agency_id',
      'users.tags',
      'users.tenant_id',
      'roles.rules'
    )
    .where('users.id', id)
    .then(r => r[0])
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
