/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser } = require('../access-helpers')
const { users: getUsers, roles: getRoles } = require('../db/users')

router.get('/', requireUser, async function (req, res) {
  const user = req.session.user
  const users = user.role === 'admin' ? await getUsers(user.tenant_id) : [user]
  const roles = await getRoles()

  res.json({ configuration: { users, roles } })
})

module.exports = router
