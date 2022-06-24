const assert = require('assert')

const arpa = require('../../../src/server/services/generate-arpa-report')

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const tenantId = 0
    const report = await arpa.generateReport(tenantId, 1)
    assert.ok(report)
  })
})
