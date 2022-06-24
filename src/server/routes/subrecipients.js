
const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const { user: getUser } = require('../db/users')
const { listRecipients, getRecipient, updateRecipient } = require('../db/arpa-subrecipients')
const { getRules } = require('../services/validation-rules')

router.get('/', requireUser, async function (req, res) {
  const recipients = await listRecipients(req.session.user.tenant_id)
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

  const rules = getRules()
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
