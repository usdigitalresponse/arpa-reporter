/*
--------------------------------------------------------------------------------
-                                 lib/spreadsheet.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const XLSX = require('xlsx')
const _ = require('lodash')

const { ValidationItem } = require('./validation-log')
const {
  columnAliases,
  columnTypeMap,
  sheetNameAliases
} = require('./field-name-mapping')
const { removeMetadata } = require('../lib/remove-metadata')

/* loadSpreadsheet() returns an array containing:
  [
    { sheetName: <the name of this sheet (aka tab aka table)>,
      data: an array of JSON arrays, one for each row in the sheet [
        [col0value, col1value, col2value, ...],
        ...
      ]
    },
    ...
  ]
  */
function loadSpreadsheet (filename) {
  const workbook = XLSX.readFile(filename)
  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName]
    return {
      sheetName,
      data: XLSX.utils.sheet_to_json(sheet, { header: 1 })
    }
  })
}

/* sheetToJson() converts an XLSX sheet to a two dimensional JS array,
  (not really JSON). So the first element in the array will be an array
  of column names
  */
function sheetToJson (sheet, toLower = true) {
  const jsonSheet = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false
  })

  if (_.isEmpty(jsonSheet)) {
    return jsonSheet
  }
  // jsonSheet[0] is an array of the column names (the first row in the sheet)
  if (toLower) {
    jsonSheet[0] = _.map(jsonSheet[0], colName => {
      const lowerCol = `${colName}`.toLowerCase().trim()
      // 20 11 24 currently this causes a bug by mis-mapping Transfer Amount
      // to award amount
      return columnAliases[lowerCol] || lowerCol
    })
  }
  return jsonSheet
}

/*  parseSpreadsheet() verifies that the sheet and column names of the uploaded
  workbook match those of the reference template, and returns the contents
  of the uploaded workbook in a {<sheetName>: <two dimensional array>, ...}.
  */
function parseSpreadsheet (workbook, templateSheets) {
  const valog = []

  // fix the sheet names
  const normalizedSheets = _.mapKeys(workbook.Sheets, (sheet, sheetName) => {
    return (
      sheetNameAliases[sheetName.toLowerCase().trim()] ||
      sheetName.toLowerCase().trim()
    )
  })

  // convert the sheets from xlsx format to AOA format
  const jsonWorkbook = _.mapValues(normalizedSheets || {}, sheet => {
    return sheetToJson(sheet)
  })

  // remove metadata rows & normalize column names
  const parsedWorkbook = {}
  Object.entries(jsonWorkbook).forEach(([sheetName, sheet]) => {
    const normalizedSheet = removeMetadata(sheetName, jsonWorkbook[sheetName])
    const [headerRow, ...rest] = normalizedSheet
    const normalizedHeader = _.map(headerRow, colName =>
      typeof colName === 'string' ? colName.toLowerCase().trim() : colName
    )
    parsedWorkbook[sheetName] = [normalizedHeader, ...rest]
  })

  _.forIn(templateSheets, (templateSheet, sheetName) => {
    const workbookSheet = parsedWorkbook[sheetName]
    if (!workbookSheet) {
      return valog.push(
        new ValidationItem({
          message: `Missing tab "${sheetName}"`
        })
      )
    }

    const workbookColumns = workbookSheet[0]
    const templateColumns = templateSheet[0]
    const missingColumns = _.difference(templateColumns, workbookColumns)

    if (missingColumns.length === 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing column "${missingColumns[0]}"`,
          tab: sheetName
        })
      )
    } else if (missingColumns.length > 1) {
      return valog.push(
        new ValidationItem({
          message: `Missing columns "${missingColumns.join('", "')}"`,
          tab: sheetName
        })
      )
    }
  })
  return { spreadsheet: parsedWorkbook, valog }
}

/*  spreadsheetToDocuments() returns an array of row objects consisting of:
   {  type:<sheet name>,
      user_id:<user ID>,
      content: {
        <column A title>:<cell contents>,
        <column B title>:<cell contents>,
        ...
      },
      sourceRow: this is a temporary field for error logging that is not
                  not written to the database
    }
  */
async function spreadsheetToDocuments (
  spreadsheet, // { <sheet name>:<two dimensional array>, ... }
  user_id,
  templateSheets
) {
  const valog = []
  const documents = []

  _.forIn(templateSheets, (templateSheet, type) => {
    const sheet = spreadsheet[type]
    // This case noted as a validation error in `parseSpreadsheet`
    // but allow for checking of additional errors.
    if (!sheet) return

    const sheetName = type.trim().toLowerCase()
    // Mark any columns not in the template to be ignored
    const cols = sheet[0].map(col => {
      return templateSheet[0].includes(col) ? col : 'ignore'
    })
    // Process data rows
    sheet.slice(1).forEach((row, i) => {
      if (row.length === 0) return

      const jsonRow = _.omit(_.zipObject(cols, row), ['ignore'])

      switch (sheetName) {
        case 'logic':
        case 'summary':
        case 'dropdowns':
          // omit these sheets
          return

        default:
          break
      }

      documents.push({
        type,
        user_id,
        content: clean(jsonRow), // changed 21 01 07
        sourceRow: i + 2 // one-based, not zero-based, and title row was omitted
      })
    })
  })
  return { documents, valog }
}

/*  removeSourceRowField() removes the sourceRow field we put into the document
  record to preserve the source row for validation reporting. We need to
  get rid of it before attempting to write the document to the db
  */
function removeSourceRowField (documents) {
  return documents.map(document => {
    delete document.sourceRow
    return document
  })
}

function uploadFilename (filename) {
  return `${process.env.UPLOAD_DIRECTORY}/${filename}`
}

/* clean() trims strings and rounds amounts
  */
function clean (objRecord) {
  const objCleaned = {}
  Object.keys(objRecord).forEach(key => {
    let val = objRecord[key] || null

    if (val === 'undefined') {
      val = null
    }
    switch (columnTypeMap[key]) {
      case 'amount':
        objCleaned[key] = _.round((Number(val) || 0), 2) || null
        break

      case 'string': {
        objCleaned[key] = cleanString(val)
        break
      }
      case 'date':
        objCleaned[key] = val
        break

      default:
        if (!val) {
          objCleaned[key] = null
        } else {
          objCleaned[key] = val
        }
        break
    }
  })
  return objCleaned
}

// cleanString() trims leading and trailing spaces.
// - If the entire string is enclosed in double quotes, removes them (does
// not remove a trailing or leading double quote without a corresponding
// one at the other end).
// - Converts double spaces to single spaces.
function cleanString (val) {
  if (!val && val !== 0) {
    return null
  }
  val = String(val).trim()
  if (val) {
    val = val.replace(/^"(.+)"$/, '$1')
      .replace(/ {2}/g, ' ')
      .trim()
  }
  return val
}

function zeroPad (code) {
  code = String(code)
  if (code.length < 3) {
    code = (`000${code}`).substr(-3)
  }
  return code
}

module.exports = {
  clean,
  cleanString,
  loadSpreadsheet,
  parseSpreadsheet,
  spreadsheetToDocuments,
  uploadFilename,
  sheetToJson,
  removeSourceRowField,
  zeroPad
}

/*                                  *  *  *                                   */
