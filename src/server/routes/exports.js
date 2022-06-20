const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const arpa = require('../services/generate-arpa-report')
const { getReportingPeriodID, isReportingPeriodCurrent } = require('../db/reporting-periods')

router.get('/', requireUser, async function (req, res) {
  const periodId = await getReportingPeriodID(req.query.period_id)

  let generator
  if (await isReportingPeriodCurrent(periodId)) {
    console.log(`periodId ${periodId} is current`)
    generator = arpa.generateReport
  } else {
    console.log(`periodId ${periodId} is not current - sending old report`)
    generator = arpa.getPriorReport
  }

  const report = await generator(periodId)

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
