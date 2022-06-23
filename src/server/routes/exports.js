const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const arpa = require('../services/generate-arpa-report')
const { getReportingPeriodID, getReportingPeriod } = require('../db/reporting-periods')

router.get('/', requireUser, async function (req, res) {
  const tenantId = req.session.user.tenant_id
  const periodId = await getReportingPeriodID(tenantId, req.query.period_id)
  const period = await getReportingPeriod(tenantId, periodId)
  if (!period) {
    return res.status(404).json({ error: 'invalid reporting period' })
  }

  const report = await arpa.generateReport(tenantId, periodId)

  if (_.isError(report)) {
    return res.status(500).send(report.message)
  }

  res.header(
    'Content-Disposition',
    `attachment; filename="${report.filename}"`
  )
  res.header('Content-Type', 'application/octet-stream')
  res.send(Buffer.from(report.content, 'binary'))
})

module.exports = router
