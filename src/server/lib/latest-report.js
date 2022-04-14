/* eslint camelcase: 0 */

const { applicationSettings } = require('../db/settings')
const FileInterface = require('./server-disk-interface')
const fileInterface = new FileInterface(process.env.TREASURY_DIRECTORY)

/*  latestReport() returns the file name of the latest Treasury Report
  generated for a period.
  If no period is specified, it returns the latest report from the current
  period.
  */
async function latestReport (period_id) {
  const allFiles = await fileInterface.listFiles()
  /* [
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-10T052459.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-14T161922.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-11T120351.xlsx",
      "Rhode-Island-Period-1-CRF-Report-to-OIG-V.2020-12-10T165454.xlsx"
    ]
  */
  if (!period_id) {
    period_id = await applicationSettings().current_reporting_period_id
  }

  const fileNames = allFiles.sort() // ascending
  fileNames.unshift('sentry')

  let filename
  let filePeriod

  do {
    filename = fileNames.pop()
    filePeriod = (filename.match(/-Period-(\d+)-/) || [])[1]
  } while (fileNames.length && Number(filePeriod) !== Number(period_id))

  if (!fileNames.length) {
    throw new Error(
      `No Treasury report has been generated for period ${period_id}`
    )
  }
  return filename
}

module.exports = {
  latestReport
}
