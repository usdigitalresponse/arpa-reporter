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
  return [...upcaseLetters, ...secondSet]
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
        humanColName: humanColNames[colIdx]
      }

      sheetRules[key] = rule
    }

    rules[type] = sheetRules
  }

  return rules
}

async function extractDropdowns (buffer) {
  const sheetName = 'Dropdowns'
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    sheets: [sheetName]
  })

  const sheet = workbook.Sheets[sheetName]

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

const run = async () => {
  log(`extracting rules from ${EMPTY_TEMPLATE_NAME}...`)

  const buffer = await readFile(path.join(SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME))
  const rules = await extractRules(buffer)
  const rulesStr = JSON.stringify(rules, null, 2)

  const rulesFilename = path.join(SRC_DIR, 'server', 'lib', 'templateRules.json')
  log(`writing extracted rules to ${rulesFilename}`)
  await writeFile(rulesFilename, rulesStr)

  const dd = await extractDropdowns(buffer)
  const ddStr = JSON.stringify(dd, null, 2)

  const ddFilename = path.join(SRC_DIR, 'server', 'lib', 'templateDropdowns.json')
  log(`writing extracted rules to ${ddFilename}`)
  await writeFile(ddFilename, ddStr)
}

run()
