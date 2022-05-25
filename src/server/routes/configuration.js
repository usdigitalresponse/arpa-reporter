/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser } = require('../access-helpers')
const { user: getUser, users: getUsers, roles: getRoles } = require('../db/users')

router.get('/', requireUser, async function (req, res) {
  const user = await getUser(req.signedCookies.userId)
  const users = user.role === 'admin' ? await getUsers() : [user]
  const roles = await getRoles()

  res.json({ configuration: { users, roles } })
})

module.exports = router
