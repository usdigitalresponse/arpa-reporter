
const path = require('path')
const { mkdir, rmdir, writeFile, readdir, readFile } = require('fs/promises')
const moment = require('moment')
const zipper = require('zip-local')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
const { documentsOfType } = require('../db/documents')
const { ARPA_REPORTS_DIR, SERVER_DATA_DIR } = require('../environment')

async function generateReportName (periodId) {
  const now = moment().utc()
  const { title: state } = await applicationSettings()

  const filename = [
    state.replace(/ /g, '-'),
    'Period',
    periodId,
    'ARPA-Treasury-Report-generated',
    now.format('YYYY-MM-DDTHH:mm:ss')
  ].join('-')

  return filename
}

/**
 * Load and parse a .xlsx template file.
 *
 * @param {string} templateName
 * @returns {any[][]}
 */
function loadTemplate (templateName) {
  const templatePath = path.join(
    SERVER_DATA_DIR,
    'treasury',
    `${templateName}.xlsx`
  )

  const workbook = XLSX.readFile(templatePath)
  if (workbook.SheetNames.length !== 1) {
    throw Error(`template ${templateName} contains multiple sheets`)
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false })
}

async function generateProject18 (periodId) {
  return loadTemplate('Project Templates/project18_229233BulkUploads')
}

async function generateProject19 (periodId) {
  return loadTemplate('Project Templates/project19_234BulkUploads')
}

async function generateProject2128 (periodId) {
  return loadTemplate('Project Templates/project2128BulkUploads')
}

async function generateProject214 (periodId) {
  return loadTemplate('Project Templates/project214_224227BulkUploads')
}

async function generateProject236 (periodId) {
  return loadTemplate('Project Templates/project236BulkUploads')
}

async function generateProject31 (periodId) {
  return loadTemplate('Project Templates/project31BulkUpload')
}

async function generateProject32 (periodId) {
  return loadTemplate('Project Templates/project32BulkUpload')
}

async function generateProject4142 (periodId) {
  return loadTemplate('Project Templates/project4142BulkUpload')
}

async function generateProject51518 (periodId) {
  return loadTemplate('Project Templates/project51518BulkUpload')
}

async function generateProject519521 (periodId) {
  return loadTemplate('Project Templates/project519521BulkUpload')
}

async function generateProjectBaseline (periodId) {
  const aoa = loadTemplate('Project Templates/projectBaselineBulkUpload')

  const dataRows = []

  let ec1documents
  try {
    ec1documents = await documentsOfType('ec 1 - public health', periodId)
  } catch (_err) {
    return new Error('Failed to load document records')
  }

  ec1documents.forEach(document => {
    dataRows.push([
      null, // first col is blank
      '1-Public Health',
      document.content['detailed expenditure category'],
      document.content['project name'], // Name
      document.content['project identification number\r\n(assigned by recipient)'], // Project_Identification_Number__c
      document.content['status of completion'], // Completion_Status__c
      document.content['adopted budget'], // Adopted_Budget__c

      // TODO: should we derive these from subaward and expenditure documents?
      document.content['total \r\nobligations'], // Total_Obligations__c
      document.content['total \r\nexpenditures'], // Total_Expenditures__c

      // TODO: what are these?
      null, // Current_Period_Obligations__c
      null, // Current_Period_Expenditures__c

      document.content['does this project include a capital expenditure?'], // Does_Project_Include_Capital_Expenditure__c
      document.content['if yes, what is the total expected capital expenditure?'], // Total_Cost_Capital_Expenditure__c

      // TODO: these are not in input template
      null, // Type_of_Capital_Expenditure__c
      null, // Type_of_Capital_Expenditure_Other__c
      null, // Capital_Expenditure_Justification__c

      document.content['project description'], // Project_Description__c
      document.content['program income earned'], // Program_Income_Earned__c
      document.content['program income expended'], // Program_Income_Expended__cs

      // FIXME: Secondary_Project_Demographics__c and Tertiary_Project_Demographics__c have same field name
      document.content['populations served'], // Primary_Project_Demographics__c
      document.content['primary project demographic explanation'], // Primary_Project_Demographics_Explanation__c
      document.content['project demographic distribution - additional populations served'], // Secondary_Project_Demographics__c
      document.content['secondary project demographic explanation'], // Secondary_Proj_Demographics_Explanation__c

      document.content['project demographic distribution - additional populations served'], // Tertiary_Project_Demographics__c
      document.content['tertiary project demographic explanation'], // Tertiary_Proj_Demographics_Explanation__c

      document.content['structure and objectives of assistance program'], // Structure_Objectives_of_Asst_Programs__c
      document.content['recipients approach'] // Recipient_Approach_Description__c
    ])
  })

  return [
    ...aoa,
    ...dataRows
  ]
}

async function generateExpendituresGT50000 (periodId) {
  return loadTemplate('expendituresGT50000BulkUpload')
}

async function generateExpendituresLT50000 (periodId) {
  return loadTemplate('expendituresLT50000BulkUpload')
}

async function generatePaymentsIndividualsLT50000 (periodId) {
  return loadTemplate('paymentsIndividualsLT50000BulkUpload')
}

async function generateSubaward (periodId) {
  return loadTemplate('subawardBulkUpload')
}

async function generateSubRecipient (periodId) {
  return loadTemplate('subawardBulkUpload')
}

async function generateReport (periodId) {
  // create a directory for the report
  const dirName = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString(),
    (await generateReportName(periodId))
  )
  await mkdir(dirName, { recursive: true })

  // generate every csv file for the report
  const csvFiles = [
    { name: 'project18_229233BulkUploads', func: generateProject18 },
    { name: 'project19_234BulkUploads', func: generateProject19 },
    { name: 'project2128BulkUploads', func: generateProject2128 },
    { name: 'project214_224227BulkUploads', func: generateProject214 },
    { name: 'project236BulkUploads', func: generateProject236 },
    { name: 'project31BulkUpload', func: generateProject31 },
    { name: 'project32BulkUpload', func: generateProject32 },
    { name: 'project4142BulkUpload', func: generateProject4142 },
    { name: 'project51518BulkUpload', func: generateProject51518 },
    { name: 'project519521BulkUpload', func: generateProject519521 },
    { name: 'projectBaselineBulkUpload', func: generateProjectBaseline },
    { name: 'expendituresGT50000BulkUpload', func: generateExpendituresGT50000 },
    { name: 'expendituresLT50000BulkUpload', func: generateExpendituresLT50000 },
    { name: 'paymentsIndividualsLT50000BulkUpload', func: generatePaymentsIndividualsLT50000 },
    { name: 'subawardBulkUpload', func: generateSubaward },
    { name: 'subRecipientBulkUpload', func: generateSubRecipient }
  ]

  // compute the CSV data for each file, and write it to disk
  await Promise.all(csvFiles.map(csvFile => {
    return csvFile.func(periodId)
      .then(csvData => {
        if (!Array.isArray(csvData)) {
          console.dir(csvFile)
          console.dir(csvData)
          throw new Error(`CSV Data from ${csvFile.name} was not an array!`)
        }

        const sheet = XLSX.utils.aoa_to_sheet(csvData)
        const csv = XLSX.utils.sheet_to_csv(sheet, { forceQuotes: true })
        return writeFile(path.join(dirName, `${csvFile.name}.csv`), csv)
      })
  }))
    .catch((err) => {
      rmdir(dirName, { recursive: true })
      throw err
    })

  // now we generate a zip file
  const zipfileName = dirName + '.zip'
  const zipfile = zipper.sync.zip(dirName)
  zipfile.compress().save(zipfileName)

  // return the correct format
  return {
    filename: path.basename(zipfileName),
    content: (await readFile(zipfileName))
  }
}

async function getPriorReport (periodId) {
  const periodReportsDir = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString()
  )

  const files = await readdir(periodReportsDir)
  const lastFileName = path.join(
    periodReportsDir,
    files.sort()[files.length - 1]
  )

  return {
    filename: path.basename(lastFileName),
    contents: (await readFile(lastFileName))
  }
}

module.exports = {
  generateReport,
  getPriorReport
}
