const assert = require('assert')
const path = require('path')
const fs = require('fs/promises')

const env = require('../../src/server/environment')

describe('environment settings', function () {
  it('SERVER_CODE_DIR point to the right place', async function () {
    const testPaths = [
      'environment.js',
      'lib/ensure-async-context.js'
    ]

    for (const relative of testPaths) {
      const absolute = path.join(env.SERVER_CODE_DIR, relative)
      const pathExists = await exists(absolute)
      assert.ok(pathExists, `expected ${absolute} to exist, is SERVER_CODE_DIR wrong?`)
    }
  })

  it('SERVER_DATA_DIR point to the right place', async function () {
    const testPaths = [
      'treasury',
      env.EMPTY_TEMPLATE_NAME
    ]

    for (const relative of testPaths) {
      const absolute = path.join(env.SERVER_DATA_DIR, relative)
      const pathExists = await exists(absolute)
      assert.ok(pathExists, `expected ${absolute} to exist, is SERVER_DATA_DIR wrong?`)
    }
  })
})

function exists (fpath) {
  return fs.access(fpath).then(
    () => true,
    () => false
  )
}
