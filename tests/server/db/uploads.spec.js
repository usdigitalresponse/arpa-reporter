
const uploads = requireSrc(__filename)
const assert = require('assert')
const { knex } = require('../mocha_init')

describe('db/uploads.js', function () {
  let upload

  beforeEach('init an upload row', async function () {
    upload = {
      filename: 'filename',
    }
  })

  describe('createUpload', function () {
    afterEach('clear uploads table', async function () {
      await knex.raw('TRUNCATE TABLE uploads CASCADE')
    })

    it('Returns the resulting row', async function () {
      const inserted = await uploads.createUpload(upload)
      assert.ok(inserted)
      assert.equal(inserted.filename, 'filename')
    })

    it('Requires a filename', async function () {
      upload.filename = null
      assert.rejects(async () => await uploads.createUpload(upload))
    })

    describe('when there is invalid user id', function () {
      it('throws an error', async function () {
        upload.user_id = 12345
        assert.rejects(async () => await uploads.createUpload(upload))
      })
    })

    describe('when there is invalid reporting period', function () {
      it('throws an error', async function () {
        upload.reporting_period_id = 12345
        assert.rejects(async () => await uploads.createUpload(upload))
      })
    })
  })
})
