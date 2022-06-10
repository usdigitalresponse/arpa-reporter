const path = require('path')
const { readFile } = require('fs/promises')

const xlsx = require('xlsx')
const { SERVER_DATA_DIR, UPLOAD_DIR, EMPTY_TEMPLATE_NAME } = require('../environment')

const reportingPeriods = require('../db/reporting-periods')

// cache treasury templates in memory after first load
const treasuryTemplates = new Map()

module.exports = {
  getTemplate,
  templateForPeriod
}

async function getTemplate (templateName) {
  if (treasuryTemplates.has(templateName)) {
    return treasuryTemplates.get(templateName)
  }
  const template = await loadTemplate(templateName)
  treasuryTemplates.set(templateName, template)
  return template
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

async function templateForPeriod (tenantId, periodId) {
  if (tenantId === undefined) {
    throw new Error('must specify tenantId in templateForPeriod');
  }
  if (periodId === undefined) {
    throw new Error('must specify periodId in templateForPeriod');
  }

  const reportingPeriod = await reportingPeriods.get(tenantId, periodId)
  const templateName = (reportingPeriod && reportingPeriod.reporting_template) || EMPTY_TEMPLATE_NAME

  try {
    const data = await readFile(path.join(SERVER_DATA_DIR, templateName))
    return { filename: templateName, data }
  } catch (err) {
    if (err.code === 'ENOENT') {
      const data = await readFile(path.join(UPLOAD_DIR, templateName))
      return { filename: templateName, data }
    } else {
      throw err
    }
  }
}
