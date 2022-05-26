/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { applicationSettings } = require('../db/settings')

router.get('/', async function (req, res) {
  const application_settings = await applicationSettings()
  res.json({ application_settings })
})

module.exports = router
