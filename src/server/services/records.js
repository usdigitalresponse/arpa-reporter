const XLSX = require('xlsx')
const { merge } = require('lodash')

const { bufferForUpload } = require('./persist-upload')
const { validForReportingPeriod } = require('../db/uploads')
const { log } = require('../lib/log')

const CERTIFICATION_SHEET = 'Certification'
const COVER_SHEET = 'Cover'

const DATA_SHEETS = [
  'EC 1 - Public Health',
  'EC 2 - Negative Economic Impact',
  'Awards > 50000',
  'Expenditures > 50000'
]

const normalizeSheetName = sheetName => sheetName.trim().toLowerCase()

function extractRecords (buffer) {
  log('extractRecords()')

  const workbook = XLSX.read(buffer, {
    cellDates: true,
    type: 'buffer',
    sheets: [CERTIFICATION_SHEET, COVER_SHEET, ...DATA_SHEETS]
  })

  // parse certification and cover as special cases
  const [certification] = XLSX.utils.sheet_to_json(workbook.Sheets[CERTIFICATION_SHEET])
  const [cover] = XLSX.utils.sheet_to_json(workbook.Sheets[COVER_SHEET])
  const subcategory = cover['Detailed Expenditure Category']

  const records = [
    { type: 'certification', content: certification },
    { type: 'cover', content: cover }
  ]

  // parse data sheets
  for (const sheetName of DATA_SHEETS) {
    const type = normalizeSheetName(sheetName)
    const sheet = workbook.Sheets[sheetName]

    // entire sheet
    const sheetRange = XLSX.utils.decode_range(sheet['!ref'])

    // range B3:3
    const headerRange = merge({}, sheetRange, {
      s: { c: 1, r: 2 },
      e: { r: 2 }
    })

    // TODO: How can we safely get the row number in which data starts
    // across template versions?
    // range B13:
    const contentRange = merge({}, sheetRange, { s: { c: 1, r: 12 } })

    const [header] = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // ask for array-of-arrays
      range: XLSX.utils.encode_range(headerRange)
    })

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header, // use values read from row 3
      range: XLSX.utils.encode_range(contentRange),
      blankrows: false
    })

    // each row in the input sheet becomes a unique record
    for (const row of rows) {
      records.push({ type, subcategory, content: row })
    }
  }

  return records
}

async function recordsForUpload (upload) {
  return extractRecords(await bufferForUpload(upload))
}

async function recordsForReportingPeriod (tenantId, periodId) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in recordsForReportingPeriod');
  }
  if (periodId === undefined) {
    throw new Error('must specify periodId in recordsForReportingPeriod');
  }

  const uploads = await validForReportingPeriod(tenantId, periodId)
  const groupedRecords = await Promise.all(
    uploads.map(upload => recordsForUpload(upload))
  )
  return groupedRecords.flat()
}

module.exports = {
  recordsForReportingPeriod,
  recordsForUpload
}
