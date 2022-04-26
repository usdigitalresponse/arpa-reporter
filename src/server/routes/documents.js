
const express = require('express')
const router = express.Router()
const { requireUser } = require('../access-helpers')

const reportingPeriods = require('../db/reporting-periods')
const { documents: listDocuments } = require('../db/documents')

router.get('/', requireUser, async function (req, res) {
  const periodId = await reportingPeriods.getID(req.query.period_id)

  const documents = listDocuments(periodId)
  return res.json({ documents })
})

module.exports = router
