const XLSX = require('xlsx')
const { merge } = require('lodash')

const { bufferForUpload } = require('./persist-upload')
const { DATA_SHEET_TYPES } = require('./records')
const { templateForPeriod } = require('./get-template')

const COLNAMES = makeColNames()
const STATES = ['AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FM', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'VI', 'WA', 'WV', 'WI', 'WY']

function makeColNames () {
  const upcaseLetters = []
  for (let i = 65; i <= 90; i++) {
    upcaseLetters.push(String.fromCharCode(i))
  }

  const secondSet = upcaseLetters.map(letter => 'A' + letter)
  return [...upcaseLetters, ...secondSet]
}

async function addCustomRules (rules) {
  // subrecipient state dropdown should contain all states
  rules.subrecipient.State_Abbreviated__c.listVals = STATES

  // return the modified rules
  return rules
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
    const listVals = rows[5].map(str => str === 'N/A' ? '' : str)
      .map(lvStr => [...lvStr.matchAll(/\w+/g)]
        .map(match => match[0]))
    const dataTypes = rows[6]
    const maxLengths = rows[7].map(ml => Number(ml))
    const humanColNames = rows[11]

    const sheetRules = {}
    for (const [colIdx, key] of colKeys.entries()) {
      // ignore the first two columns
      if (colIdx < 2) continue

      // ignore if key is blank
      if (!key) continue

      // construct rule
      const rule = {
        key,
        required: required[colIdx],
        dataType: dataTypes[colIdx],
        maxLength: maxLengths[colIdx],
        listVals: listVals[colIdx],
        columnName: COLNAMES[colIdx],
        humanColName: humanColNames[colIdx]
      }

      sheetRules[key] = rule
    }

    rules[type] = sheetRules
  }

  return addCustomRules(rules)
}

async function rulesForUpload (upload) {
  return extractRules(await bufferForUpload(upload))
}

async function rulesForPeriod (periodId) {
  return extractRules(
    (await templateForPeriod(periodId)).data
  )
}

module.exports = {
  rulesForUpload,
  rulesForPeriod
}
