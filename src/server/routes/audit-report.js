/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()

const { requireUser } = require('../access-helpers')
const { generate } = require('../lib/audit-report.old')

router.get('/', requireUser, async function (req, res) {
  console.log('/api/audit-report GET')

  let report
  try {
    report = await generate()
  } catch (error) {
    return res.status(500).send(error.message)
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
