const path = require('path')

const xlsx = require('xlsx')
const { SERVER_DATA_DIR } = require('../environment')

// cache treasury templates in memory after first load
const treasuryTemplates = new Map()

module.exports = {
  getTemplate
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

/*                                 *  *  *                                    */
