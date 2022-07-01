// uploads.js handles uploading an agency report spreadsheet to the database.
/* eslint camelcase: 0 */

const express = require('express')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const multer = require('multer')
const multerUpload = multer({ storage: multer.memoryStorage() })

const { getReportingPeriodID } = require('../db/reporting-periods')
const { usedForTreasuryExport, getUpload, uploadsInSeries, uploadsInPeriod } = require('../db/uploads')

const { recordsForUpload } = require('../services/records')
const { persistUpload, bufferForUpload } = require('../services/persist-upload')
const { validateUpload } = require('../services/validate-upload')
const ValidationError = require('../lib/validation-error')

router.get('/', requireUser, async function (req, res) {
  const tenantId = req.session.user.tenant_id
  const periodId = await getReportingPeriodID(tenantId, req.query.period_id)
  const uploads = await uploadsInPeriod(tenantId, periodId)
  return res.json({ uploads })
})

router.post('/', requireUser, multerUpload.single('spreadsheet'), async (req, res, next) => {
  console.log('POST /api/uploads')
  if (req.file) {
    console.log('Filename:', req.file.originalname, 'size:', req.file.size)
  }

  try {
    const upload = await persistUpload({
      user: req.session.user,
      filename: req.file.originalname,
      buffer: req.file.buffer
    })

    res.status(200).json({ upload, error: null })
  } catch (e) {
    res.status(e instanceof ValidationError ? 400 : 500).json({ error: e.message, upload: null })
  }
})

router.get('/:id', requireUser, async (req, res) => {
  const id = req.params.id

  const upload = await getUpload(id)
  if (!upload || upload.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  res.json({ upload })
})

router.get('/:id/series', requireUser, async (req, res) => {
  const { id } = req.params

  const upload = await getUpload(id)
  if (!upload || upload.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  let series
  if (upload.agency_id && upload.ec_code) {
    series = await uploadsInSeries(upload)
  } else {
    series = [upload]
  }

  const allExported = await usedForTreasuryExport(upload.tenant_id, upload.reporting_period_id)
  const seriesExported = allExported.find(upl => (upl.agency_id === upload.agency_id && upl.ec_code === upload.ec_code))

  res.json({
    upload,
    series,
    seriesExported
  })
})

router.get('/:id/records', requireUser, async (req, res) => {
  const { id } = req.params

  const upload = await getUpload(id)
  if (!upload || upload.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const records = await recordsForUpload(upload)
  res.json({
    upload,
    records
  })
})

router.get('/:id/download', requireUser, async (req, res) => {
  const { id } = req.params
  const upload = await getUpload(id)

  if (!upload || upload.tenant_id !== req.session.user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  const buffer = await bufferForUpload(upload)

  res.header(
    'Content-Disposition',
    `attachment; filename="${upload.filename}"`
  )
  res.header('Content-Type', 'application/octet-stream')
  res.end(buffer)
})

router.post('/:id/validate', requireUser, async (req, res) => {
  const { id } = req.params

  const user = req.session.user
  const upload = await getUpload(id)
  if (!upload || upload.tenant_id !== user.tenant_id) {
    res.sendStatus(404)
    res.end()
    return
  }

  try {
    const errors = await validateUpload(upload, user)

    res.json({
      errors: errors.map(e => e.toObject()),
      upload
    })
  } catch (e) {
    let msg = e.message
    if (e.code === 'ENOENT') msg = 'Cannot find upload data; please re-submit this upload'

    res.status(500).json({ error: msg })
  }
})

module.exports = router
