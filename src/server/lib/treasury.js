/*
--------------------------------------------------------------------------------
-                                 lib/treasury.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const XLSX = require('xlsx')
const { documentsWithProjectCode } = require('../db')

const {
  applicationSettings
  // currentReportingPeriodSettings
} = require('../db/settings')

const { getTreasuryTemplateSheets } = require('../services/get-template')

let log = () => {}
if (process.env.VERBOSE) {
  log = console.log
}

async function getNewFilename (period_id) {
  const timeStamp = new Date().toISOString().split('.')[0].split(':').join('')
  let { title: state, current_reporting_period_id } =
    await applicationSettings()
  period_id = period_id || current_reporting_period_id
  state = state.replace(/ /g, '-')
  const filename = `${state}-Period-${period_id}-[arpa-placeholder].${timeStamp}`
  log(`Filename is ${filename}`)

  return filename
}

async function getBaselineRow (period_id) {

  let documents
  try {
    documents = await documentsWithProjectCode(period_id)
  } catch (_err) {
    return new Error('Failed to load document records')
  }

  log(`Found ${documents.length} documents`)

  const rowObject = {}

  documents.forEach(record => {
    console.log(record)

    switch (record.type) {
      case 'certification':
        break
      case 'cover':
        rowObject.Project_Expenditure_Category__c = record.content['expenditure category group']
        rowObject.Sub_Category__c = record.content['detailed expenditure category']
    }
  })

  return [
    null, // first col is blank
    rowObject.Project_Expenditure_Category__c,
    rowObject.Sub_Category__c,
    'Community Violence Reduction', // Name
    '768622', // Project_Identification_Number__c
    'Completed less than 50%', // Completion_Status__c
    '20000000', // Adopted_Budget__c
    '200000', // Total_Obligations__c
    '100000', // Total_Expenditures__c
    // Current_Period_Obligations__c
    // Current_Period_Expenditures__c
    'No', // Does_Project_Include_Capital_Expenditure__c
    null, // Total_Cost_Capital_Expenditure__c
    // Type_of_Capital_Expenditure__c
    // Type_of_Capital_Expenditure_Other__c
    // Capital_Expenditure_Justification__c
    'Funding to support community collaborative responses to increases in violence crime stemming from the pandemic', // Project_Description__c
    '0', // Program_Income_Earned__c
    null // Program_Income_Expended__cs
    // Primary_Project_Demographics__c
    // Primary_Project_Demographics_Explanation__c
    // Secondary_Project_Demographics__c
    // Secondary_Proj_Demographics_Explanation__c
    // Tertiary_Project_Demographics__c
    // Tertiary_Proj_Demographics_Explanation__c
    // Structure_Objectives_of_Asst_Programs__c
    // Recipient_Approach_Description__c
  ]
}

/*  generateReport generates a fresh Treasury Report spreadsheet
    and writes it out if successful.
    */
async function generateReport (period_id) {
  const treasuryTemplateSheets = getTreasuryTemplateSheets()

  const filename = (await getNewFilename(period_id)) + '.csv'

  // FIXME: This stub assumes and generates only the baseline template.
  let baselineAoa = treasuryTemplateSheets.Sheet1
  const row = await getBaselineRow(period_id)
  baselineAoa = [...baselineAoa, row]
  const baselineSheet = XLSX.utils.aoa_to_sheet(baselineAoa)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, baselineSheet, 'Sheet1')
  const outputWorkBook = XLSX.write(workbook, {
    bookType: 'csv',
    type: 'buffer',
    sheet: 'Sheet1'
  })

  return { filename, outputWorkBook }
}

module.exports = {
  generateReport
}
