#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises'
import path from 'path'

import 'dotenv/config'
import chalk from 'chalk'
import XLSX from 'xlsx'
import lodash from 'lodash'

import { DATA_SHEET_TYPES } from '../src/server/services/records.js'
import { SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME, SRC_DIR } from '../src/server/environment.js'

const { merge } = lodash
const log = (msg) => { console.log(chalk.green(msg)) }

const COLNAMES = makeColNames()

function makeColNames () {
  const upcaseLetters = []
  for (let i = 65; i <= 90; i++) {
    upcaseLetters.push(String.fromCharCode(i))
  }

  const secondSet = upcaseLetters.map(letter => 'A' + letter)
  const thirdSet = upcaseLetters.map(letter => 'B' + letter)
  return [...upcaseLetters, ...secondSet, ...thirdSet]
}

function parseListVal (lvStr) {
  if (lvStr === 'N/A') return []

  let lines = lvStr.split('\n')

  // remove whitespace on each pick list option
  lines = lines.map(line => line.trim())

  // un-quote each entry
  lines = lines.map(line => line.replace(/^"/, '').replace(/"$/, ''))

  return lines
}

function parseRequired (rqStr) {
  if (rqStr === 'Required') return true
  if (rqStr === 'Optional') return false
  return rqStr
}

// for the given type and column, return all the EC codes where that column is shown/used
function filterEcCodes (logic, type, columnName) {
  const logicCodes = logic.filter(log => log.type === type)
  if (logicCodes.length === 0) return false

  const ecCodes = []
  for (const logic of logicCodes) {
    if (logic.columnNames[columnName]) {
      ecCodes.push(logic.ecCode)
    }
  }

  return ecCodes
}

async function extractRules (workbook, logic) {
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
    const required = rows[3].map(str => parseRequired(str))
    const listVals = rows[5].map(str => parseListVal(str))
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
        humanColName: humanColNames[colIdx],
        ecCodes: filterEcCodes(logic, type, COLNAMES[colIdx])
      }

      sheetRules[key] = rule
    }

    rules[type] = sheetRules
  }

  return rules
}

async function extractDropdowns (workbook) {
  const sheet = workbook.Sheets.Dropdowns

  // entire sheet
  const sheetRange = XLSX.utils.decode_range(sheet['!ref'])

  // range B2:
  const headerRange = merge({}, sheetRange, {
    s: { c: 1, r: 1 }
  })

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range: XLSX.utils.encode_range(headerRange)
  })

  const dropdowns = {}

  rows[0].map(n => n.trim()).forEach((colName, colIdx) => {
    dropdowns[colName] = []
    let rowIdx = 1
    while (rows[rowIdx][colIdx]) {
      dropdowns[colName].push(rows[rowIdx][colIdx])
      rowIdx += 1
    }
  })

  return dropdowns
}

async function extractLogic (workbook) {
  const sheet = workbook.Sheets.Logic

  // entire sheet
  const sheetRange = XLSX.utils.decode_range(sheet['!ref'])

  // range A2:
  const headerRange = merge({}, sheetRange, {
    s: { c: 0, r: 1 }
  })

  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: XLSX.utils.encode_range(headerRange)
  })

  const sheetNames = Object.fromEntries(workbook.SheetNames.entries())
  const logic = rows.map(row => {
    // parse EC code
    const codeString = row['Detail Expenditure']
    const codeParts = codeString.split('-')
    const ecCode = codeParts[0]
    const ecCodeDesc = codeParts.slice(1, codeParts.length).join('-')

    // type that this logic rule applies to
    const sheetName = sheetNames[row.Sheet - 1]
    const type = DATA_SHEET_TYPES[sheetName]

    // which columns are relevant given the ec code?
    const columnNames = Object.fromEntries(
      COLNAMES.map(columnName => [columnName, Boolean(row[columnName])])
    )

    return {
      type,
      ecCode,
      ecCodeDesc,
      columnNames
    }
  })

  return logic
}

async function saveTo (destFilename, data) {
  const destPath = path.join(SRC_DIR, 'server', 'lib', destFilename)
  const strData = JSON.stringify(data, null, 2)

  log(`writing to ${destFilename}`)
  return writeFile(destPath, strData)
}

const run = async () => {
  log(`extracting rules from ${EMPTY_TEMPLATE_NAME}...`)

  // read the workbook
  const buffer = await readFile(path.join(SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME))
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const logic = await extractLogic(workbook)

  const rules = await extractRules(workbook, logic)
  await saveTo('templateRules.json', rules)

  const dropdowns = await extractDropdowns(workbook)
  await saveTo('templateDropdowns.json', dropdowns)
}

run()
