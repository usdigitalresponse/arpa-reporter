/*
--------------------------------------------------------------------------------
-                         routes/reporting-periods.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const path = require('path')
const { mkdir, writeFile } = require('fs/promises')

const express = require('express')
const router = express.Router()
const moment = require('moment')

const multer = require('multer')
const multerUpload = multer({ storage: multer.memoryStorage() })

const knex = require('../db/connection')
const reportingPeriods = require('../db/reporting-periods')
const { UPLOAD_DIR } = require('../environment')
const { requireUser, requireAdminUser } = require('../access-helpers')
const { user: getUser } = require('../db/users')
const { templateForPeriod } = require('../services/get-template')
const { validForReportingPeriod } = require('../db/uploads')

const { revalidateUploads } = require('../services/revalidate-uploads')

router.get('/', requireUser, async function (req, res) {
  const allPeriods = await reportingPeriods.getAll()
  const reporting_periods = []

  const now = moment()

  allPeriods.forEach(period => {
    if (moment(period.start_date) <= now) {
      reporting_periods[period.id - 1] = period
    }
  })

  return res.json({ reporting_periods, all_reporting_periods: allPeriods })
})

router.get('/summaries/', requireUser, async function (req, res) {
  return reportingPeriods.getPeriodSummaries().then(summaries => res.json({ summaries }))
})

router.post('/close/', requireAdminUser, async (req, res) => {
  console.log('POST /reporting_periods/close/')

  const user = await getUser(req.signedCookies.userId)

  try {
    await reportingPeriods.close(user)
  } catch (err) {
    return res.status(500).send(err.message)
  }

  res.json({
    status: 'OK'
  })
})

function validateReportingPeriod (req, res, next) {
  next()
}

router.post('/', requireAdminUser, validateReportingPeriod, function (req, res, next) {
  console.log('POST /reporting_periods', req.body)
  const {
    name,
    start_date,
    end_date,
    period_of_performance_end_date,
    crf_end_date
  } = req.body
  const reportingPeriod = {
    name,
    start_date,
    end_date,
    period_of_performance_end_date,
    crf_end_date
  }
  reportingPeriods.createReportingPeriod(reportingPeriod)
    .then(result => res.json({ reportingPeriod: result }))
    .catch(e => {
      next(e)
    })
})

router.put('/:id', requireAdminUser, validateReportingPeriod, async function (
  req,
  res,
  next
) {
  console.log('PUT /reporting_periods/:id', req.body)
  let reportingPeriod = await reportingPeriods.get(req.params.id)
  if (!reportingPeriod) {
    res.status(404).send('Reporting period not found')
    return
  }
  const {
    name,
    start_date,
    end_date,
    period_of_performance_end_date,
    crf_end_date
  } = req.body
  reportingPeriod = {
    ...reportingPeriod,
    name,
    start_date,
    end_date,
    period_of_performance_end_date,
    crf_end_date
  }
  reportingPeriods.updateReportingPeriod(reportingPeriod)
    .then(result => res.json({ reportingPeriod: result }))
    .catch(e => {
      next(e)
    })
})

router.post(
  '/:id/template',
  requireAdminUser,
  multerUpload.single('template'),
  async (req, res, next) => {
    if (!req.file) {
      res.status(400).send('File missing')
      return
    }

    const periodId = req.params.id
    const reportingPeriod = await reportingPeriods.get(periodId)
    if (!reportingPeriod) {
      res.status(404).send('Reporting period not found')
      return
    }

    const { originalname: filename, size, buffer } = req.file
    console.log(
      `Uploading filename ${filename} size ${size} for period ${periodId}`)

    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
      await writeFile(
        path.join(UPLOAD_DIR, filename),
        buffer,
        { flag: 'wx' }
      )
    } catch (e) {
      res.json({
        success: false,
        errorMessage: e.code === 'EEXIST'
          ? `The file ${filename} already exists. `
          : e.message
      })
      return
    }

    reportingPeriod.reporting_template = filename
    return reportingPeriods.updateReportingPeriod(reportingPeriod)
      .then(() => res.json({ success: true, reportingPeriod }))
      .catch(e => next(e))
  }
)

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
    const exportedUploads = await validForReportingPeriod(periodId)
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
