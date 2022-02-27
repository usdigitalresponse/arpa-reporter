const expect = require('chai').expect
const path = require('path')
const { makeUploadArgs } = require('./helpers')

const { processUpload } = requireSrc(__filename)

const dirFixtures = path.resolve(__dirname, '../fixtures')

describe.skip('services/process-upload', () => {
  describe('subrecipients', () => {
    it('fails when missing both subrecipient code and duns', async () => {
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'data-subrecipients',
          'EOHHS-075-09302020-missing_id-v1.xlsx'
        )
      )
      const result = await processUpload(uploadArgs)
      const err = result.valog.getLog()[0] || {}
      expect(err.message).to.equal(
        'Each subrecipient must have either an "identification number" or a "duns number"'
      )
      expect(err.row).to.equal(3)
    })
    it('fails when there is no duns number and "city name" is missing.', async () => {
      const uploadArgs = makeUploadArgs(
        path.resolve(
          dirFixtures,
          'data-subrecipients',
          'EOHHS-075-09302020-missing_sub_city_name-v1.xlsx'
        )
      )
      const result = await processUpload(uploadArgs)
      const log = result.valog.getLog()
      expect(
        log.length,
        JSON.stringify(result.valog.getLog(), null, 2)
      ).to.equal(1)
      expect(log[0].message).to.equal(
        'City name must not be blank when DUNS number is not provided'
      )
      expect(log[0].row).to.equal(4)
    })
  })
})
