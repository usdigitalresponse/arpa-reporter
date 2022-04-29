/* eslint camelcase: 0 */

const path = require('path')
const { mkdir, writeFile, readFile } = require('fs/promises')

const xlsx = require('xlsx')

const knex = require('../db/connection')
const reportingPeriods = require('../db/reporting-periods')
const { createUpload } = require('../db/uploads')
const { createDocuments } = require('../db/documents')

const { UPLOAD_DIR } = require('../environment')

const { ValidationError } = require('./validate-upload')

const normalizeSheetName = (sheetName) => sheetName.trim().toLowerCase()

const uploadFSName = (upload) => {
  const filename = `upload-id-${upload.id}${path.extname(upload.filename)}`
  return path.join(UPLOAD_DIR, filename)
}

async function extractDocuments (buffer) {
  const workbook = await xlsx.read(buffer, { type: 'buffer' })

  // get begin generating (partial) document rows
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
  // first parse the upload into documents
  let documents
  try {
    documents = await extractDocuments(buffer)
  } catch (e) {
    throw new ValidationError(`Cannot parse XLSX from data in ${filename}: ${e}`)
  }

  let upload
  await knex.transaction(async trx => {
    const reportingPeriod = await reportingPeriods.get()

    // next, create an upload row, and document rows for all documents
    const uploadRow = {
      filename: path.basename(filename),
      reporting_period_id: reportingPeriod.id,
      user_id: user.id
    }
    upload = await createUpload(uploadRow, trx)

    // next, create rows for all the documents
    const docRows = documents.map(doc => ({
      type: doc.type,
      content: JSON.stringify(doc.content),
      upload_id: upload.id
    }))

    await createDocuments(docRows, trx)
  })

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

module.exports = { persistUpload, ValidationError, bufferForUpload }
