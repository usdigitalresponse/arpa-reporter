const debug = require('debug')('persist-uploads')
const xlsx = require('xlsx')
const { bufferForUpload } = require('./persist-upload')
const { uploadsForPeriod } = require('../db/uploads')

const normalizeSheetName = (sheetName) => sheetName.trim().toLowerCase()

async function extractDocuments (buffer) {
  const workbook = await xlsx.read(buffer, { type: 'buffer' })

  const documents = []
  for (const sheetName of workbook.SheetNames) {
    debug(`extracting ${sheetName} (${workbook.Sheets[sheetName]['!ref']}`)
    documents.push({
      type: normalizeSheetName(sheetName),
      content: xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, blankrows: false })
    })
  }

  debug('done extracting')
  return documents
}

async function documentsForUpload (upload) {
  return extractDocuments(await bufferForUpload(upload))
}

async function documentsForPeriod (periodId) {
  const uploads = uploadsForPeriod(periodId)
  return uploads.flatMap(upload => documentsForUpload(upload))
}

module.exports = {
  documentsForPeriod,
  documentsForUpload
}
