/* eslint camelcase: 0 */

let log = () => {}
if (process.env.VERBOSE) {
  log = console.dir
}

const {
  agencyByCode,
  user,
  createUpload,
  createDocuments,
  deleteDocuments,
  getProject,
  transact
} = require('../db')

const FileInterface = require('../lib/server-disk-interface')
const fileInterface = new FileInterface()
const { validateUpload } = require('./validate-upload')

const processUpload = async ({
  filename,
  user_id,
  agency_id,
  data,
  reporting_period_id = null
}) => {
  log(`processUpload(): filename is ${filename}`)

  const {
    valog,
    documents,
    spreadsheet,
    fileParts,
    reportingPeriod
  } = await validateUpload({
    filename,
    user_id,
    agency_id,
    data,
    reporting_period_id
  })

  if (!valog.success()) {
    log('valog.success() is false')
    return { valog, upload: {} }
  }

  try {
    await fileInterface.writeFileCarefully(filename, data)
  } catch (e) {
    valog.append(
      e.code === 'EEXIST'
        ? `The file ${filename} is already in the database. ` +
          'Change the version number to upload again.'
        : e.message
    )
  }

  if (!valog.success()) {
    return { valog, upload: {} }
  }

  let upload
  let result
  try {
    const project = await getProject(fileParts.projectId)
    const agency = await agencyByCode(fileParts.agencyCode)
    if (agency[0]) {
      agency_id = agency[0].id
    }
    result = await transact(async trx => { // eslint-disable-line
      const current_user = await user(user_id)
      // write an upload record for saved file
      upload = await createUpload(
        {
          filename,
          created_by: current_user.email,
          user_id,
          agency_id,
          project_id: project.id,
          reporting_period_id: reportingPeriod.id
        },
        trx
      )
      // delete existing records for this agencyCode-projectID-reportingDate
      await deleteDocuments(fileParts)

      // Enhance the documents with the resulting upload.id. Note this needs
      // to be done here to get the upload and document insert operations into
      // the same transaction.
      const subs = []
      const docs = []
      documents.forEach(doc => {
        doc.upload_id = upload.id

        if (doc.type === 'subrecipient') {
          subs.push(doc)
        } else {
          docs.push(doc)
        }
      })
      // FIXME: Save subrecipients data to subrecipients table?
      // subrecipients.update(subs)
      const createResult = createDocuments(docs, trx)
      return createResult
    })
    // console.log(`Inserted ${(result || {}).rowCount} documents.`);
  } catch (e) {
    console.log(e)
    try {
      await fileInterface.rmFile(filename)
    } catch (rmErr) {
      // This should never happen.
      console.error('rmFile error:', rmErr.message)
    }
    valog.append('Upload and import failed. ' + e.message)
  }

  return { valog, upload, spreadsheet }
}

module.exports = { processUpload }
