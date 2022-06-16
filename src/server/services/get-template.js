const path = require('path')
const { mkdir, readFile, writeFile } = require('fs/promises')

const xlsx = require('xlsx')
const { SERVER_DATA_DIR, EMPTY_TEMPLATE_NAME, PERIOD_TEMPLATES_DIR } = require('../environment')

const reportingPeriods = require('../db/reporting-periods')

// cache treasury templates in memory after first load
const treasuryTemplates = new Map()

module.exports = {
  getTemplate,
  templateForPeriod,
  savePeriodTemplate
}

function periodTemplatePath (reportingPeriod) {
  return path.join(
    PERIOD_TEMPLATES_DIR,
    `${reportingPeriod.id}.template`
  )
}

async function savePeriodTemplate (periodId, fileName, buffer) {
  const reportingPeriod = await reportingPeriods.get(periodId)

  await mkdir(PERIOD_TEMPLATES_DIR, { recursive: true })
  await writeFile(
    periodTemplatePath(reportingPeriod),
    buffer,
    { flag: 'w' }
  )

  reportingPeriod.template_filename = fileName
  await reportingPeriods.updateReportingPeriod(reportingPeriod)
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

async function templateForPeriod (periodId) {
  const reportingPeriod = await reportingPeriods.get(periodId)

  if (reportingPeriod.template_filename) {
    const filename = reportingPeriod.template_filename
    const data = await readFile(periodTemplatePath(reportingPeriod))
    return { filename, data }
  } else {
    const filename = EMPTY_TEMPLATE_NAME
    const data = await readFile(path.join(SERVER_DATA_DIR, filename))
    return { filename, data }
  }
}
