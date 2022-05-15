const assert = require('assert')

const underTest = '../../src/server/environment'

describe('environment settings', function () {
  beforeEach('clear env module', function () {
    delete require.cache[require.resolve(underTest)]
  })

  it('points the CODE_DIR at src', function () {
    const env = require(underTest)
    assert.equal(env.SRC_DIR.slice(env.SRC_DIR.length - 3), 'src')
  })
})
