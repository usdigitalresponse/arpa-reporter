
const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const { listRecipients, getRecipient } = require('../db/arpa-recipients')
const { rulesForPeriod } = require('../services/validation-rules')

router.get('/', requireUser, async function (req, res) {
  const recipients = await listRecipients()
  return res.json({ recipients })
})

router.get('/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id)

  const recipient = await getRecipient(id)
  if (!recipient) {
    res.sendStatus(404)
    res.end()
    return
  }

  const rules = await rulesForPeriod(recipient.reporting_period_id)
  res.json({ recipient, rules: rules.subrecipient })
})

module.exports = router
