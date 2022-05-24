/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { applicationSettings } = require('../db/settings')
const { requireUser } = require('../access-helpers')

router.get('/', requireUser, function (req, res) {
  const tenantId = req.session.user.tenant_id;
  applicationSettings(tenantId).then(application_settings =>
    res.json({ application_settings })
  )
})

module.exports = router
