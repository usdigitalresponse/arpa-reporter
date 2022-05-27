const express = require('express')
const { requireAdminUser } = require('../access-helpers')
const { fixSubrecipients } = require('../services/fix-subrecipients')

const router = express.Router()

// FIXME: This route is not implemented for ARPA
router.post('/:id', requireAdminUser, async (req, res) => {
  console.log('POST /fix-subrecipients/:id')
  // TODO: fixSubrecipients was deleted in #252, but if it's re-added make sure
  // to do a tenant_id check here.
  return res.json({ documents: await fixSubrecipients(req.params.id) })
})

module.exports = router
