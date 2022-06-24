/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { applicationSettings } = require('../db/settings')
const { requireUser } = require('../access-helpers')

router.get('/', requireUser, async function (req, res) {
  const application_settings = await applicationSettings(req.session.user.tenant_id)
  res.json({ application_settings })
})

module.exports = router
