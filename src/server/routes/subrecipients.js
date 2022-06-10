
// TODO(mbroussard): holding off for now on making tenant_id changes in this
// file because it is either removed or revamped in
// https://github.com/usdigitalresponse/arpa-reporter/pull/260

const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const { user: getUser } = require('../db/users')
const { listRecipients, getRecipient, updateRecipient } = require('../db/arpa-subrecipients')
const { rulesForPeriod } = require('../services/validation-rules')

router.get('/', requireUser, async function (req, res) {
  const recipients = await listRecipients()
  return res.json({ recipients })
})

router.get('/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id)

  const recipient = await getRecipient(id)
  if (!recipient || recipient.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const rules = await rulesForPeriod(req.session.user.tenant_id, recipient.reporting_period_id)
  res.json({ recipient, rules: rules.subrecipient })
})

router.post('/:id', requireUser, async (req, res) => {
  const id = Number(req.params.id)
  const user = await getUser(req.signedCookies.userId)

  const recipient = await getRecipient(id)
  if (!recipient || recipient.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const record = JSON.parse(req.body.record)
  if (record.Unique_Entity_Identifier__c !== recipient.uei || record.EIN__c !== recipient.tin) {
    res.status(400).json({ error: 'Record cannot modify UEI or TIN' })
    return
  }

  const updatedRecipient = await updateRecipient(recipient.id, { record, updatedByUser: user })
  res.json({ recipient: updatedRecipient })
})

module.exports = router
