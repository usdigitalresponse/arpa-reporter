/* eslint camelcase: 0 */

const path = require('path')
const { mkdir, writeFile, readFile } = require('fs/promises')

const xlsx = require('xlsx')

const reportingPeriods = require('../db/reporting-periods')
const { createUpload } = require('../db/uploads')

const { UPLOAD_DIR } = require('../environment')

const ValidationError = require('../lib/validation-error')

const normalizeSheetName = (sheetName) => sheetName.trim().toLowerCase()

const uploadFSName = (upload) => {
  const filename = `upload-id-${upload.id}${path.extname(upload.filename)}`
  return path.join(UPLOAD_DIR, filename)
}

async function extractDocuments (buffer) {
  const workbook = await xlsx.read(buffer, { type: 'buffer' })

  const documents = []
  for (const sheetName of workbook.SheetNames) {
    documents.push({
      type: normalizeSheetName(sheetName),
      content: xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
    })
  }

  return documents
}

async function persistUpload ({ filename, user, buffer }) {
  // let's make sure we can actually read the supplied buffer (it's a valid spreadsheet)
  try {
    await xlsx.read(buffer, { type: 'buffer' })
  } catch (e) {
    throw new ValidationError(`Cannot parse XLSX from data in ${filename}: ${e}`)
  }

  // get the current reporting period
  const reportingPeriod = await reportingPeriods.get()

  // create an upload
  const uploadRow = {
    filename: path.basename(filename),
    reporting_period_id: reportingPeriod.id,
    user_id: user.id
  }
  const upload = await createUpload(uploadRow)

  // persist the original upload to the filesystem
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(
      uploadFSName(upload),
      buffer,
      { flag: 'wx' }
    )
  } catch (e) {
    throw new ValidationError(`Cannot persist ${upload.filename} to filesystem: ${e}`)
  }

  // return the upload we created
  return upload
}

async function bufferForUpload (upload) {
  const data = await readFile(uploadFSName(upload))
  return Buffer.from(data, 'binary')
}

async function documentsForUpload (upload) {
  return extractDocuments(bufferForUpload(upload))
}

module.exports = {
  persistUpload,
  bufferForUpload,
  documentsForUpload
}
