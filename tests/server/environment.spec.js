const assert = require('assert')
const { tmpdir } = require('os')

const underTest = '../../src/server/environment'

describe('environment settings', function () {
  const savedDataDir = process.env.DATA_DIR

  beforeEach('clear env module', function () {
    delete require.cache[require.resolve(underTest)]
  })

  beforeEach('set DATA_DIR env var', function () {
    process.env.DATA_DIR = '/arpa/reporter/datadir'
  })

  afterEach('unset DATA_DIR env var', function () {
    process.env.DATA_DIR = savedDataDir
  })

  describe('when there is a DATA_DIR set', function () {
    it('sets the data dir', function () {
      const env = require(underTest)
      assert.equal(env.DATA_DIR, process.env.DATA_DIR)
    })
  })

  describe('when there is no DATA_DIR env set', function () {
    beforeEach('clear DATA_DIR env var', function () {
      process.env.DATA_DIR = ''
    })

    it('generates a temporary path for the data dir', function () {
      const env = require(underTest)
      assert.ok(env.DATA_DIR)
      assert.equal(tmpdir(), env.DATA_DIR.slice(0, tmpdir().length))
    })
  })
})
