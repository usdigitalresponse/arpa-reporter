// uploads.js handles uploading an agency report spreadsheet to the database.
/* eslint camelcase: 0 */

const express = require('express')
const fs = require('fs')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const multer = require('multer')
const multerUpload = multer({ storage: multer.memoryStorage() })

const { user: getUser } = require('../db')
const { documentsForUpload } = require('../db/documents')
const reportingPeriods = require('../db/reporting-periods')
const { uploadsForAgency, validForReportingPeriod, upload: getUpload, uploads: listUploads } = require('../db/uploads')

const { persistUpload, uploadFSName, ValidationError } = require('../services/persist-upload')
const { validateUpload } = require('../services/validate-upload')

router.get('/', requireUser, async function (req, res) {
  const period_id = await reportingPeriods.getID(req.query.period_id)
  const user = await getUser(req.signedCookies.userId)
  const docs = user.agency_id
    ? await uploadsForAgency(user.agency_id, period_id)
    : await listUploads(period_id)
  return res.json({ uploads: docs })
})

router.post('/', requireUser, multerUpload.single('spreadsheet'), async (req, res, next) => {
  console.log('POST /api/uploads')
  if (req.file) {
    console.log('Filename:', req.file.originalname, 'size:', req.file.size)
  }

  const user = await getUser(req.signedCookies.userId)

  try {
    const upload = await persistUpload({
      user,
      filename: req.file.originalname,
      buffer: req.file.buffer
    })

    res.status(200).json({ upload, error: null })
  } catch (e) {
    console.dir(e)

    res.status(e instanceof ValidationError ? 400 : 500).json({ error: e.message, upload: null })
  }
})

router.get('/:id', requireUser, (req, res) => {
  const { id } = req.params
  getUpload(id).then(upload => {
    if (!upload) {
      res.sendStatus(404)
      res.end()
    } else {
      res.json({ upload })
    }
  })
})

router.get('/:id/series', requireUser, async (req, res) => {
  const { id } = req.params

  const upload = await getUpload(id)
  if (!upload) {
    res.sendStatus(404)
    res.end()
    return
  }

  let series
  if (upload.agency_id) {
    series = await uploadsForAgency(upload.agency_id, upload.reporting_period_id)
  } else {
    series = [upload]
  }

  const allValid = await validForReportingPeriod(upload.reporting_period_id)
  const currentValid = allValid.find(upl => upl.agency_id === upload.agency_id)

  res.json({
    upload,
    series,
    currently_valid: currentValid
  })
})

router.get('/:id/documents', requireUser, async (req, res) => {
  const { id } = req.params

  const upload = await getUpload(id)
  if (!upload) {
    res.sendStatus(404)
    res.end()
    return
  }

  const documents = await documentsForUpload(upload.id)
  res.json({
    upload,
    documents
  })
})

router.get('/:id/download', requireUser, (req, res) => {
  const { id } = req.params
  getUpload(id).then(upload => {
    if (!upload) {
      res.sendStatus(404)
      res.end()
    } else {
      const attachmentData = fs.readFileSync(uploadFSName(upload))
      res.header(
        'Content-Disposition',
        `attachment; filename="${upload.filename}"`
      )
      res.header('Content-Type', 'application/octet-stream')
      res.end(Buffer.from(attachmentData, 'binary'))
    }
  })
})

router.get('/:id/validate', requireUser, async (req, res) => {
  const { id } = req.params

  const user = await getUser(req.signedCookies.userId)
  const upload = await getUpload(id)
  if (!upload) {
    res.sendStatus(404)
    res.end()
    return
  }

  const errors = await validateUpload(upload, user)
  res.status(errors.length === 0 ? 200 : 400).json({
    errors: errors.map(e => e.toObject()),
    upload
  })
})

module.exports = router
