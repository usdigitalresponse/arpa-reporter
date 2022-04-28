
const path = require('path')
const { mkdir, rmdir, writeFile, readdir, readFile } = require('fs/promises')
const moment = require('moment')
const zipper = require('zip-local')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
const { documentsOfType, documentsForUpload } = require('../db/documents')
const { validForReportingPeriod } = require('../db/uploads')
const { ARPA_REPORTS_DIR, SERVER_DATA_DIR } = require('../environment')
const { removeMetadata } = require('../lib/remove-metadata')

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

async function generateProjectBaseline (periodId, sources) {
  const aoa = loadTemplate('Project Templates/projectBaselineBulkUpload')

  const dataRows = []

  const ec1documents = sources['ec 1 - public health']

  ec1documents.forEach((ec1doc, idx) => {
    for (const row of ec1doc.jsonRows) {
      dataRows.push([
        null, // first col is blank
        '1-Public Health',
        'TODO detailed exp category',
        row.name, // Name
        row.project_identification_number__c, // Project_Identification_Number__c
        row.completion_status__c, // Completion_Status__c
        row.adopted_budget__c, // Adopted_Budget__c
        row.total_obligations__c, // Total_Obligations__c
        row.total_expenditures__c, // Total_Expenditures__c
        row.current_period_obligations__c, // Current_Period_Obligations__c
        row.period_expenditures__c, // Current_Period_Expenditures__c
        row.does_project_include_capital_expenditure__c, // Does_Project_Include_Capital_Expenditure__c
        row.total_cost_capital_expenditure__c, // Total_Cost_Capital_Expenditure__c
        row.type_of_capital_expenditure__c, // Type_of_Capital_Expenditure__c
        row.type_of_capital_expenditure_other__c, // Type_of_Capital_Expenditure_Other__c
        row.capital_expenditure_justification__c, // Capital_Expenditure_Justification__c
        row.project_description__c, // Project_Description__c
        row.program_income_earned__c, // Program_Income_Earned__c
        row.program_income_expended__cs, // Program_Income_Expended__cs
        row.primary_project_demographics__c, // Primary_Project_Demographics__c
        row.primary_project_demographics_explanation__c, // Primary_Project_Demographics_Explanation__c
        row.secondary_project_demographics__c, // Secondary_Project_Demographics__c
        row.secondary_proj_demographics_explanation__c, // Secondary_Proj_Demographics_Explanation__c
        row.tertiary_project_demographics__c, // Tertiary_Project_Demographics__c
        row.tertiary_proj_demographics_explanation__c, // Tertiary_Proj_Demographics_Explanation__c
        row.structure_objectives_of_asst_programs__c, // Structure_Objectives_of_Asst_Programs__c
        row.recipient_approach_description__c // Recipient_Approach_Description__c
      ])
    }
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

function aoaToJSON (type, aoa) {
  const justData = removeMetadata(type, aoa)
  const colNames = justData[0].map(col => col.toLowerCase())

  const jsonRows = []
  justData.slice(1).forEach(row => {
    if (row.length === 0) return

    const jsonRow = {}
    colNames.forEach((colName, idx) => {
      jsonRow[colName] = row[idx]
    })

    jsonRows.push(jsonRow)
  })

  return jsonRows
}

async function loadPeriodSources (periodId) {
  const uploads = await validForReportingPeriod(periodId)
  const documents = {}

  for (const upload of uploads) {
    const uDocs = await documentsForUpload(upload.id)
    for (const uDoc of uDocs) {
      if (uDoc.type === 'logic') continue

      uDoc.agency_id = upload.agency_id
      uDoc.jsonRows = aoaToJSON(uDoc.type, uDoc.content)

      if (documents[uDoc.type]) {
        documents[uDoc.type].push(uDoc)
      } else {
        documents[uDoc.type] = [uDoc]
      }
    }
  }

  return documents
}

async function generateReport (periodId) {
  // create a directory for the report
  const dirName = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString(),
    (await generateReportName(periodId))
  )
  await mkdir(dirName, { recursive: true })

  // load the sources used to generate the report
  const sources = await loadPeriodSources(periodId)

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
    return csvFile.func(periodId, sources)
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
