/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser } = require('../access-helpers')
const { roles: getRoles } = require('../db/users')

router.get('/', requireUser, async function (req, res) {
  const roles = await getRoles()

  res.json({ configuration: { roles } })
})

module.exports = router
