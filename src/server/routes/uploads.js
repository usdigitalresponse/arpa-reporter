// uploads.js handles uploading an agency report spreadsheet to the database.
/* eslint camelcase: 0 */

const express = require('express')
const fs = require('fs')

const router = express.Router()
const { requireUser } = require('../access-helpers')

const multer = require('multer')
const multerUpload = multer({ storage: multer.memoryStorage() })

const { user: getUser } = require('../db')
const reportingPeriods = require('../db/reporting-periods')
const { uploadsForAgency, upload: getUpload, uploads: listUploads } = require('../db/uploads')

const { persistUpload, uploadFSName, ValidationError } = require('../services/process-upload')
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

  let upload
  let status = 200
  const errors = []

  try {
    upload = await persistUpload({
      user,
      filename: req.file.originalname,
      buffer: req.file.buffer
    })

    const validationErrors = await validateUpload(upload.id)
    if (validationErrors.length) {
      status = 400
      validationErrors.forEach(e => errors.push(e))
    }
  } catch (e) {
    console.dir(e)
    errors.push(e)
    status = (e instanceof ValidationError) ? 400 : 500
  }

  res.status(status).json({
    errors,
    upload
  })
})

router.get('/:id', requireUser, (req, res) => {
  const { id } = req.params
  getUpload(id).then(upload => {
    if (!upload) {
      res.sendStatus(404)
      res.end()
    } else {
      res.json(upload)
    }
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

module.exports = router
