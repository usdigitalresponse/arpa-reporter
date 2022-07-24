const assert = require('assert')

const { generateReport } = require(__filename)
const { withTenantId } = require('../helpers/with-tenant-id')

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const report = await withTenantId(1, generateReport)
    assert.ok(report)
  })
})
