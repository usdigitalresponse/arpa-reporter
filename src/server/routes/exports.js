/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const _ = require('lodash')

const { requireUser } = require('../access-helpers')
const arpa = require('../services/generate-arpa-report')
const reportingPeriods = require('../db/reporting-periods')

router.get('/', requireUser, async function (req, res) {
  const periodId = await reportingPeriods.getID(req.query.period_id)

  let report
  if (await reportingPeriods.isCurrent(periodId)) {
    console.log(`periodId ${periodId} is current`)
    report = await arpa.generateReport(periodId)
  } else {
    console.log(`periodId ${periodId} is not current - sending old report`)
    report = await arpa.getPriorReport(periodId)
  }

  if (_.isError(report)) {
    return res.status(500).send(report.message)
  }

  res.header(
    'Content-Disposition',
    `attachment; filename="${report.filename}"`
  )
  res.header('Content-Type', 'application/octet-stream')
  res.send(Buffer.from(report.outputWorkBook, 'binary'))
})

module.exports = router

/*                                  *  *  *                                   */
