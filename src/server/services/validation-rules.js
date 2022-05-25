const XLSX = require('xlsx')
const { merge } = require('lodash')

const { bufferForUpload } = require('./persist-upload')
const { DATA_SHEET_TYPES } = require('./records')
const { templateForPeriod } = require('./get-template')

const COLNAMES = makeColNames()

function makeColNames () {
  const upcaseLetters = []
  for (let i = 65; i <= 90; i++) {
    upcaseLetters.push(String.fromCharCode(i))
  }

  const secondSet = upcaseLetters.map(letter => 'A' + letter)
  return [...upcaseLetters, ...secondSet]
}

async function extractRules (buffer) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    sheets: Object.keys(DATA_SHEET_TYPES)
  })

  const rules = {}

  for (const sheetName of Object.keys(DATA_SHEET_TYPES)) {
    const type = DATA_SHEET_TYPES[sheetName]
    const sheet = workbook.Sheets[sheetName]

    // entire sheet
    const sheetRange = XLSX.utils.decode_range(sheet['!ref'])

    // range A1:13
    const headerRange = merge({}, sheetRange, {
      s: { c: 0, r: 0 },
      e: { r: 12 }
    })

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      range: XLSX.utils.encode_range(headerRange)
    })

    const colKeys = rows[2]
    const required = rows[3].map(req => req === 'Required')
    const listVals = rows[5]
      .map(lvStr => [...lvStr.matchAll(/\w+/g)]
        .map(match => match[0]))
    const dataTypes = rows[6]
    const maxLengths = rows[7].map(ml => Number(ml))

    const sheetRules = {}
    for (const [colIdx, key] of colKeys.entries()) {
      // ignore the first two columns
      if (colIdx < 2) continue

      // ignore if key is blank
      if (!key) continue

      // construct rule
      const rule = {
        key,
        columnName: COLNAMES[colIdx],
        type: dataTypes[colIdx],
        required: required[colIdx],
        maxLength: maxLengths[colIdx],
        listVals: listVals[colIdx]
      }

      sheetRules[key] = rule
    }

    rules[type] = sheetRules
  }

  return rules
}

async function rulesForUpload (upload) {
  return extractRules(await bufferForUpload(upload))
}

async function rulesForPeriod (periodId) {
  return extractRules(
    (await templateForPeriod).data
  )
}

module.exports = {
  rulesForUpload,
  rulesForPeriod
}
