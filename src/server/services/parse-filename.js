/* eslint camelcase: 0 */

let log = () => {}
if (process.env.VERBOSE) {
  log = console.dir
}
const { ValidationItem } = require('../lib/validation-log')
const { agencies, agencyByCode, projectByCode } = require('../db')
const { format } = require('date-fns')

// To more clearly understand this regex, checkout this railroad diagram visualization:
// https://regexper.com/#%2F%5E%28%5Ba-zA-Z%5D%2B%29-%28.%2B%29-%28%5B0-9%5D%7B8%7D%29-%28%5B%5E-%5D%2B%29%24%2F
// Capture groups should be:
// 1. Agency Code (alphanumeric)
// 2. Project Code (arbitrary string)
// 3. Reporting period date (MMDDYYYY)
// 4. Version (v followed by any number of digits)
const FILENAME_REGEX = /^([a-zA-Z0-9]+)-(.+)-([0-9]{8})-v(\d+)$/

const parseFilename = async (filename, reportingPeriod) => {
  log(`filename is ${filename}`)
  log('Agencies are:')
  log(await agencies())
  const endDate = (reportingPeriod || {}).end_date
  if (!endDate) throw new Error('Error finding reportingPeriod')
  log(reportingPeriod)
  log(`endDate is ${endDate}`)
  const expectedEndReportDate = format(endDate, 'MMddyyyy')
  const valog = []

  const [, name, ext] = filename.match(/^(.*)\.([^.]+)$/) || []
  if (!['xlsx', 'xlsm'].includes(ext)) {
    valog.push(
      new ValidationItem({
        message: 'Uploaded file must have ".xlsx" or ".xlsm" extension'
      })
    )
  }

  const execResult = FILENAME_REGEX.exec(name)

  if (execResult === null) {
    valog.push(
      new ValidationItem({
        message:
          `Uploaded file name must match pattern
      <agency abbrev>-<project id>-<reporting due date>` +
          `-v<version number>.xlsx
      Example: EOH-013-${expectedEndReportDate}-v1.xlsx
      `
      })
    )
  }

  const [, agencyCode, projectId, reportingDate, version_str] = execResult

  if (!agencyCode) {
    valog.push(
      new ValidationItem({
        message: 'First part of file name must be an agency code.'
      })
    )
  } else {
    const result = await agencyByCode(agencyCode)
    if (result.length < 1) {
      valog.push(
        new ValidationItem({
          message: `The agency code "${agencyCode}" in the filename is not valid.`
        })
      )
    }
  }

  if (!projectId) {
    valog.push(
      new ValidationItem({
        message: 'Second part of file name must be a project id.'
      })
    )
  } else {
    const project = await projectByCode(projectId)
    if (project.length < 1) {
      valog.push(
        new ValidationItem({
          message: `The project id "${projectId}" in the filename is not valid.`
        })
      )
    }
  }

  const shortExpectedEndReportDate = format(endDate, 'MMddyy')
  if (
    reportingDate !== expectedEndReportDate &&
    reportingDate !== shortExpectedEndReportDate
  ) {
    valog.push(
      new ValidationItem({
        message: 'The reporting period end date in the filename is ' +
        `"${reportingDate}" but should be "${expectedEndReportDate}" or ` +
        `"${shortExpectedEndReportDate}"`
      })
    )
  }

  const version = parseInt(version_str, 10)
  if (!version) {
    valog.push(
      new ValidationItem({
        message: 'Filename is missing the version number'
      })
    )
  }

  return { agencyCode, projectId, reportingDate, version, valog }
}

module.exports = {
  parseFilename
}
