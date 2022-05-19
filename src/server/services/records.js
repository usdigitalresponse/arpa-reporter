const XLSX = require('xlsx')
const { merge } = require('lodash')

const { bufferForUpload } = require('./persist-upload')
const { validForReportingPeriod } = require('../db/uploads')
const { log } = require('../lib/log')

const DATA_SHEETS = [
  'Certification',
  'Cover',
  'EC 1 - Public Health',
  'EC 2 - Negative Economic Impact'
]

const normalizeSheetName = sheetName => sheetName.trim().toLowerCase()

function extractRecords (buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', sheets: DATA_SHEETS })
  log('extractRecords()')

  const records = []
  for (const sheetName of workbook.SheetNames) {
    log('sheetName', sheetName)
    const type = normalizeSheetName(sheetName)
    log('type', type)
    const sheet = workbook.Sheets[sheetName]

    // skip sheets that weren't read from file
    if (!sheet) continue

    // entire sheet
    const sheetRange = XLSX.utils.decode_range(sheet['!ref'])

    // range 3:3
    const headerRange = merge({}, sheetRange, { s: { c: 1, r: 2 }, e: { r: 2 } })

    // range 12:
    const contentRange = merge({}, sheetRange, { s: { c: 1, r: 11 } })

    const [header] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: XLSX.utils.encode_range(headerRange) })

    const rows = XLSX.utils.sheet_to_json(sheet, { header, range: XLSX.utils.encode_range(contentRange), blankrows: false })

    for (const row of rows) {
      records.push({ type: type, content: row })
    }
  }

  return records
}

async function recordsForUpload (upload) {
  return extractRecords(await bufferForUpload(upload))
}

async function recordsForReportingPeriod (periodId) {
  const uploads = await validForReportingPeriod(periodId)
  log(uploads)
  const groupedRecords = await Promise.all(uploads.map(upload => recordsForUpload(upload)))
  return groupedRecords.flat()
}

module.exports = {
  recordsForReportingPeriod,
  recordsForUpload
}
