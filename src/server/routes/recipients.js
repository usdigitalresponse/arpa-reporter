
const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const { listRecipients } = require('../db/arpa-recipients')

router.get('/', requireUser, async function (req, res) {
  const recipients = await listRecipients()
  return res.json({ recipients })
})

module.exports = router
