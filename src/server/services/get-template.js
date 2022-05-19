const path = require('path')

const fs = require('fs')
const xlsx = require('xlsx')
const _ = require('lodash')
const { SERVER_DATA_DIR } = require('../environment')
const { log } = require('../lib/log')
const { sheetToJson } = require('../lib/spreadsheet')

// cache treasury templates in memory after first load
const treasuryTemplates = new Map()

const validation = {
  template: null,
  sheets: null,
  dropdownValues: null
}

module.exports = {
  getDropdownValues,
  getTemplate,
  getValidationTemplateSheets
}

function getDropdownValues () {
  if (!validation.dropdownValues) {
    loadValidationTemplate()
  }
  return validation.dropdownValues
}

async function getTemplate (templateName) {
  if (treasuryTemplates.has(templateName)) {
    return treasuryTemplates.get(templateName)
  }
  const template = await loadTemplate(templateName)
  treasuryTemplates.set(templateName, template)
  return template
}

function getValidationTemplateSheets () {
  if (!validation.sheets) {
    loadValidationTemplate()
  }
  return validation.sheets
}

function loadXlsxFile (fileName) {
  const filePath = path.resolve(__dirname, `../data/${fileName}`)
  // console.log(`loadTreasuryTemplate: filePath is |${filePath}|`);

  return xlsx.read(fs.readFileSync(filePath), { type: 'buffer' })
}

function loadDropdownValues () {
  const dropdownTab = validation.template.Sheets.Dropdowns
  const dropdownSheet = xlsx.utils.sheet_to_json(dropdownTab, {
    header: 1,
    blankrows: false
  })
  const dropdownValues = _.fromPairs(
    _.zip(
      // zip to pair each column name with array of values for each column
      _.map(dropdownSheet[1], _.toLower), // second row is the column name
      _.map(
        // zip to convert each column to an array of values for each column
        // (matrix transpose)
        _.zip(...dropdownSheet.slice(2)),
        // pipe each column array into a map that compacts each array and
        // lowercases values
        colAr => _.map(_.compact(colAr), _.toLower)
      )
    ).slice(1)
  )
  return dropdownValues
}

async function loadTemplate (templateName) {
  const templatePath = path.join(
    SERVER_DATA_DIR,
    'treasury',
    `${templateName}.xlsx`
  )

  const workbook = xlsx.readFile(templatePath)
  if (workbook.SheetNames.length !== 1) {
    throw Error(`template ${templateName} contains multiple sheets`)
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  return xlsx.utils.sheet_to_json(worksheet, { header: 1, blankrows: false })
}

function loadValidationTemplate () {
  if (!process.env.VALIDATION_TEMPLATE) {
    throw new Error('Validation template key missing from environment!')
  }
  const xlsxTemplate = loadXlsxFile(process.env.VALIDATION_TEMPLATE)
  const objAoaSheets = {}

  _.keys(xlsxTemplate.Sheets).forEach(tabName => {
    if (tabName === 'Dropdowns') return
    const sheetName = tabName.toLowerCase().trim()
    const templateSheet = _.get(xlsxTemplate, ['Sheets', tabName])
    const json = sheetToJson(templateSheet)
    json[0] = json[0].map(_.toLower)
    objAoaSheets[sheetName] = json
  })

  validation.template = xlsxTemplate
  validation.sheets = objAoaSheets
  log('Validation template loaded...')

  validation.dropdownValues = loadDropdownValues()
  log('Dropdown values loaded...')
  delete validation.sheets.Dropdowns
  return 'OK'
}

/*                                 *  *  *                                    */
