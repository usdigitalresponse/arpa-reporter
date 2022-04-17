const SHEETS_WITHOUT_METADATA = ['certification', 'cover']
const NUM_METADATA_COLS = 1 // number of leftmost columns to ignore

/**
 * The macro-powered ARPA reporting input template uses the first ten rows for
 * metadata. This data was useful while authoring the input template, but is not
 * useful for reporting.
 *
 * This method identifies sheets with this pattern and removes these rows.
 *
 * @param {string} sheetName
 * @param {any[][]} sheet
 */
function removeMetadata (sheetName, sheet) {
  if (SHEETS_WITHOUT_METADATA.includes(sheetName.toLowerCase())) {
    return sheet
  }

  const fieldIdRowIndex = sheet.findIndex(
    row => row[0]?.toLowerCase() === 'treasury column title (field id)'
  )

  const headerRowIndex = sheet.findIndex(row =>
    ['label', 'column label'].includes(row[0]?.toLowerCase())
  )

  // remove metadata cols
  const sheetWithoutMetadataCols = sheet.map(row =>
    row.slice(NUM_METADATA_COLS)
  )

  // remove metadata rows
  const sheetWithoutMetadata = sheetWithoutMetadataCols.filter(
    (row, index) => index === fieldIdRowIndex || index > headerRowIndex
  )

  return sheetWithoutMetadata
}

module.exports = {
  removeMetadata
}
