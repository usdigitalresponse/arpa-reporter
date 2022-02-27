/* eslint no-unused-expressions: "off" */
const path = require('path')

const fs = require('fs')
const { processUpload } = requireSrc(__filename)
const knex = requireSrc(path.resolve(__dirname, '../db/connection'))
const expect = require('chai').expect
const util = require('util')
const setTimeoutPromise = util.promisify(setTimeout)

const {
  setCurrentReportingPeriod
} = requireSrc(path.resolve(__dirname, '../db/settings'))
const { makeUploadArgs, resetUploadsAndDb } = require('./helpers')

const dirFixtures = path.resolve(__dirname, '../fixtures')

describe.skip('services/process_upload', () => {
  describe('process-upload.spec.js - baseline success', () => {
    it('processes without error', async () => {
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          'EOHHS-075-09302020-simple-v1.xlsx'
        )
      )
      const result = await processUpload(uploadArgs)
      expect(
        result.valog.getLog(),
        JSON.stringify(result.valog.getLog(), null, 2)
      ).to.be.empty
      return result
    })
  })
  describe('filename failures', () => {
    const filenameTests = [
      {
        label: 'bad extension',
        file: 'GOV-1020-09302020-badExtension-v1.csv',
        expects: /must have ".xlsx" extension/
      },
      {
        label: 'version number',
        file: 'GOV-1020-09302020-missingVersion.xlsx',
        expects: /Filename is missing the version number/
      },
      {
        label: 'report date',
        file: 'GOV-1020-07302020-incorrectReportDate-v1.xlsx',
        expects: /The reporting period end date in the filename is "07302020" but should be "09302020" or "093020"/
      },
      {
        label: 'project id',
        file: 'GOV-InvalidProjectID-09302020-v1.xlsx',
        expects: /The project id ".*" in the filename is not valid/
      },
      {
        label: 'agency code',
        file: 'InvalidAgencyCode-013-09302020-v1.xlsx',
        expects: /The agency code ".*" in the filename is not valid/
      },
      {
        label: 'pattern',
        file: 'InvalidPattern-v1.xlsx',
        expects: /Uploaded file name must match pattern.*/
      }
    ]

    filenameTests.forEach(ftest => {
      it(ftest.label, async () => {
        await setCurrentReportingPeriod(1)
        const uploadArgs = makeUploadArgs(
          path.resolve(
            dirFixtures,
            'file-name',
            ftest.file
          )
        )
        const result = await processUpload(uploadArgs)
        expect(result.valog.getLog()[0].message).to.match(ftest.expects)
      })
    })

    it('fails when a duplicate file is uploaded', async () => {
      await resetUploadsAndDb()
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          'EOHHS-075-09302020-simple-v1.xlsx'
        )
      )
      const successResult = await processUpload(uploadArgs)
      expect(
        successResult.valog.getLog(),
        JSON.stringify(successResult.valog.getLog(), null, 2)
      ).to.be.empty
      const dupUploadResult = await processUpload(uploadArgs)
      expect(dupUploadResult.valog.getLog()[0].message).to.match(
        /The file .* is already in the database/
      )
    })
  })

  describe('file structure failures', () => {
    it('fails missing tab', async () => {
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-structure',
          'EOHHS-075-09302020-missingContractsTab-v1.xlsx'
        )
      )
      const result = await processUpload(uploadArgs)
      expect(result.valog.getLog()[0].message).to.match(/Missing tab/)
    })

    it('fails missing column', async () => {
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-structure',
          'EOHHS-075-09302020-missingColumn-v1.xlsx'
        )
      )
      const result = await processUpload(uploadArgs)
      expect(result.valog.getLog()[0].message).to.match(/Missing column/)
    })
  })

  describe('database checks', () => {
    beforeEach(resetUploadsAndDb)
    it('replaces upload record on re-upload when the file is lost', async () => {
      const testFile = 'EOHHS-075-09302020-simple-v1.xlsx'
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          testFile
        )
      )

      // first upload
      const result1 = await processUpload(uploadArgs)
      const originalDate = result1.upload.created_at
      fs.unlinkSync(`${process.env.UPLOAD_DIRECTORY}/${testFile}`)

      // second upload
      await setTimeoutPromise(10)
      const result2 = await processUpload(uploadArgs)
      const replacedDate = result2.upload.created_at
      expect(replacedDate).to.not.equal(originalDate)
      expect(result2.valog.getLog()).to.have.length(0)
    })

    it('deletes old documents when new version is uploaded', async () => {
      // Do two uploads
      const uploadArgs1 = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          'EOHHS-075-09302020-simple-v1.xlsx'
        )
      )
      const result1 = await processUpload(uploadArgs1)

      const afterFirstUpload = await knex('documents')
        .distinct('upload_id')
        .orderBy('upload_id')
      // Check the first upload
      expect(
        result1.valog.getLog(),
        JSON.stringify(result1.valog.getLog(), null, 2)
      ).to.be.empty

      expect(afterFirstUpload).to.deep.equal([{ upload_id: result1.upload.id }])

      // For the second upload use a file with similar content but a
      // different cover page, rather than a new version of the first
      // report.
      // Note that a previous version of this test left the project number
      // the same and changed the agency, and expected it to not overwrite
      // the previously uploaded project 075 file.
      // 21 02 01 This was erroneous - we want to key only on the project,
      // because the states can move a project from one agency to another,
      // and because the Treasury doesn't track the agency, only the
      // project ID. So this upload now changes the projectID as well as
      // the agency so that with the corrected behavior, it does not
      // overwrite the just-uploaded file
      const uploadArgs2 = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          'GOV-078-09302020-simple-v1.xlsx'
        )
      )
      const result2 = await processUpload(uploadArgs2)

      // Check the second upload
      expect(
        result2.valog.getLog(),
        JSON.stringify(result2.valog.getLog(), null, 2)
      ).to.have.length(0)
      const beforeReplace = await knex('documents')
        .distinct('upload_id')
        .orderBy('upload_id')
      expect(beforeReplace).to.deep.equal([{ upload_id: result1.upload.id }, { upload_id: result2.upload.id }])

      // Do the replacement of upload of v1 by uploading a new version of that
      // file simulated here by changing the filename.
      // An upload overwrites a previous upload with a matching project ID
      // and period - see src/server/db/deleteDocuments()
      // So this should overwrite 'EOHHS-075-09302020-simple-v1.xlsx', even
      // though the agency code is different.
      const uploadArgs3 = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'file-success',
          'GOV-075-09302020-simple-v2.xlsx'
        )
      )
      uploadArgs3.filename = uploadArgs3.filename.replace(/-v1/, '-v2')
      const result3 = await processUpload(uploadArgs3)

      // Check that there are new docs for upload 3 and upload 1 docs are gone.
      expect(result3.valog.getLog()).to.have.length(0)
      const afterReplace = await knex('documents')
        .distinct('upload_id')
        .orderBy('upload_id')
      expect(afterReplace).to.deep.equal([{ upload_id: result2.upload.id }, { upload_id: result3.upload.id }])
    })
  })
})

/*                                 *  *  *                                    */
