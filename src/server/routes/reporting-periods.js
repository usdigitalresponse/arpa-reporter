/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()

const multer = require('multer')
const multerUpload = multer({ storage: multer.memoryStorage() })

const knex = require('../db/connection')
const reportingPeriods = require('../db/reporting-periods')
const { requireUser, requireAdminUser } = require('../access-helpers')
const { user: getUser } = require('../db/users')
const { savePeriodTemplate, templateForPeriod } = require('../services/get-template')
const { usedForTreasuryExport } = require('../db/uploads')

const { revalidateUploads } = require('../services/revalidate-uploads')

router.get('/', requireUser, async function (req, res) {
  const periods = await reportingPeriods.getAll()
  return res.json({ reportingPeriods: periods })
})

router.get('/summaries/', requireUser, async function (req, res) {
  return reportingPeriods.getPeriodSummaries().then(summaries => res.json({ summaries }))
})

router.post('/close/', requireAdminUser, async (req, res) => {
  const period = await reportingPeriods.get()
  const user = await getUser(req.signedCookies.userId)

  const trns = await knex.transaction()
  try {
    await reportingPeriods.close(user, period, trns)
    trns.commit()
  } catch (err) {
    if (!trns.isCompleted()) trns.rollback()
    return res.status(500).json({ error: err.message })
  }

  res.json({
    status: 'OK'
  })
})

router.post('/', requireAdminUser, async function (req, res, next) {
  const updatedPeriod = req.body.reportingPeriod

  try {
    if (updatedPeriod.id) {
      const period = await reportingPeriods.updateReportingPeriod(updatedPeriod)
      res.json({ reportingPeriod: period })
    } else {
      const period = await reportingPeriods.createReportingPeriod(updatedPeriod)
      res.json({ reportingPeriod: period })
    }
  } catch (e) {
    if (e.message.match(/violates unique constraint/)) {
      res.status(400).json({ error: 'Period conflicts with an existing one' })
    } else {
      res.status(500).json({ error: e.message })
    }
  }
})

router.post(
  '/:id/template',
  requireAdminUser,
  multerUpload.single('template'),
  async (req, res, next) => {
    if (!req.file) {
      res.status(400).json({ error: 'File missing' })
      return
    }

    const periodId = req.params.id
    const reportingPeriod = await reportingPeriods.get(periodId)
    if (!reportingPeriod) {
      res.status(404).json({ error: 'Reporting period not found' })
      return
    }

    const { originalname, size, buffer } = req.file
    console.log(
      `Uploading filename ${originalname} size ${size} for period ${periodId}`)

    try {
      await savePeriodTemplate(periodId, originalname, buffer)
    } catch (e) {
      res.status(500).json({
        success: false,
        errorMessage: e.message
      })
      return
    }

    res.json({ success: true })
  })

router.get('/:id/template', requireUser, async (req, res, next) => {
  const periodId = req.params.id

  try {
    const { filename, data } = await templateForPeriod(periodId)

    res.header(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    )
    res.header('Content-Type', 'application/octet-stream')
    res.end(data)
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Could not find template file' })
    } else {
      res.status(500).json({ error: err.message })
    }
  }
})

router.get('/:id/exported_uploads', requireUser, async (req, res, next) => {
  const periodId = req.params.id

  try {
    const exportedUploads = await usedForTreasuryExport(periodId)
    return res.json({ exportedUploads })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/revalidate', requireAdminUser, async (req, res, next) => {
  const periodId = req.params.id
  const commit = req.query.commit || false

  const user = await getUser(req.signedCookies.userId)
  const reportingPeriod = await reportingPeriods.get(periodId)
  if (!reportingPeriod) {
    res.sendStatus(404)
    res.end()
    return
  }

  const trns = await knex.transaction()
  try {
    const updates = await revalidateUploads(reportingPeriod, user, trns)
    if (commit) {
      trns.commit()
    } else {
      trns.rollback()
    }

    res.json({
      updates
    })
  } catch (e) {
    if (!trns.isCompleted()) trns.rollback()
    res.status(500).json({ error: e.message })
    throw e
  }
})

module.exports = router

/*                                 *  *  *                                    */
