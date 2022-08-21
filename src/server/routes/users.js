/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser, requireAdminUser } = require('../access-helpers')
const { createUser, users: listUsers, updateUser, roles: listRoles, user: getUser } = require('../db/users')
const { agencyById } = require('../db/agencies')
const { sendWelcomeEmail } = require('../lib/email')
const _ = require('lodash-checkit')

async function validateUser (user, creator) {
  const { email, role, agency_id } = user
  if (!email) {
    throw new Error('User email is required')
  }
  if (!_.isEmail(email)) {
    throw new Error('Invalid email address')
  }
  if (!role) {
    throw new Error('Role required')
  }

  if (agency_id) {
    const agency = await agencyById(agency_id)
    if (!agency || agency.tenant_id !== creator.tenant_id) {
      throw new Error('Invalid agency')
    }
  } else if (role !== 'admin') {
    throw new Error('Reporter role requires agency')
  }

  return null
}

router.get('/', requireUser, async function (req, res, next) {
  const allUsers = await listUsers()
  const curUser = allUsers.find(u => u.id === Number(req.signedCookies.userId))

  const users = (curUser.role === 'admin') ? allUsers : [curUser]
  const roles = await listRoles()
  res.json({ users, roles })
})

router.post('/', requireAdminUser, async function (req, res, next) {
  const creator = req.session.user
  const user = req.body.user
  user.email = user.email.toLowerCase().trim()

  try {
    await validateUser(user, creator)
  } catch (e) {
    res.status(400).json({ error: e.message })
    return
  }

  try {
    if (user.id) {
      const existingUser = await getUser(user.id)
      if (!existingUser || existingUser.tenant_id !== creator.tenant_id) {
        res.status(404).json({ error: 'invalid user' })
        return
      }

      const updatedUser = await updateUser(user)
      res.json({ user: updatedUser })
    } else {
      const updatedUser = await createUser(user)
      res.json({ user: updatedUser })

      void sendWelcomeEmail(updatedUser.email, req.headers.origin)
    }
  } catch (e) {
    console.dir(e)

    if (e.message.match(/violates unique constraint/)) {
      res.status(400).json({ error: 'User with that email already exists' })
    } else {
      next(e)
    }
  }
})

module.exports = router
