/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser } = require('../access-helpers')
const { users: getUsers, roles: getRoles } = require('../db/users')

router.get('/', requireUser, async function (req, res) {
  const user = req.session.user
  const tenantId = user.tenant_id
  const users = user.role === 'admin' ? await getUsers(tenantId) : [user]
  const roles = await getRoles()

  res.json({ configuration: { users, roles } })
})

module.exports = router
