const XLSX = require('xlsx')
const { merge } = require('lodash')

const { bufferForUpload } = require('./persist-upload')
const { usedForTreasuryExport } = require('../db/uploads')
const { log } = require('../lib/log')
const { requiredArgument } = require('../lib/preconditions')

const CERTIFICATION_SHEET = 'Certification'
const COVER_SHEET = 'Cover'
const LOGIC_SHEET = 'Logic'

const DATA_SHEET_TYPES = {
  'EC 1 - Public Health': 'ec1',
  'EC 2 - Negative Economic Impact': 'ec2',
  'EC 3 - Public Sector Capacity': 'ec3',
  'EC 4 - Premium Pay': 'ec4',
  'EC 5 - Infrastructure': 'ec5',
  'EC 7 - Admin': 'ec7',
  'Subrecipient': 'subrecipient',
  'Awards > 50000': 'awards50k',
  'Expenditures > 50000': 'expenditures50k',
  'Aggregate Awards < 50000': 'awards'
}

function readVersionRecord (workbook) {
  const range = {
    s: { r: 0, c: 1 },
    e: { r: 0, c: 1 }
  }

  const [row] = XLSX.utils.sheet_to_json(
    workbook.Sheets[LOGIC_SHEET],
    { header: 1, range }
  )

  return {
    version: row[0]
  }
}

async function recordsForUpload (upload) {
  log('recordsForUpload()')

  const buffer = await bufferForUpload(upload)
  const workbook = XLSX.read(buffer, {
    cellDates: true,
    type: 'buffer',
    sheets: [CERTIFICATION_SHEET, COVER_SHEET, LOGIC_SHEET, ...Object.keys(DATA_SHEET_TYPES)]
  })

  // parse certification and cover as special cases
  const [certification] = XLSX.utils.sheet_to_json(workbook.Sheets[CERTIFICATION_SHEET])
  const [cover] = XLSX.utils.sheet_to_json(workbook.Sheets[COVER_SHEET])
  const subcategory = cover['Detailed Expenditure Category']

  const records = [
    { type: 'certification', upload, content: certification },
    { type: 'cover', upload, content: cover },
    { type: 'version', upload, content: readVersionRecord(workbook) }
  ]

  // parse data sheets
  for (const sheetName of Object.keys(DATA_SHEET_TYPES)) {
    const type = DATA_SHEET_TYPES[sheetName]
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
      records.push({ type, subcategory, upload, content: row })
    }
  }

  return records
}

async function recordsForReportingPeriod (tenantId, periodId) {
  requiredArgument(tenantId, 'must specify tenantId in recordsForReportingPeriod')
  requiredArgument(periodId, 'must specify periodId in recordsForReportingPeriod')

  const uploads = await usedForTreasuryExport(tenantId, periodId)
  const groupedRecords = await Promise.all(
    uploads.map(upload => recordsForUpload(upload))
  )
  return groupedRecords.flat()
}

module.exports = {
  recordsForReportingPeriod,
  recordsForUpload,
  DATA_SHEET_TYPES,
  readVersionRecord
}
