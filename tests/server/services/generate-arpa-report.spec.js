const assert = require('assert')

const arpa = require('../../../src/server/services/generate-arpa-report')

// Default tenant ID
const tenantId = 0;

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const report = await arpa.generateReport(tenantId, 0)
    assert.ok(report)
  })
})
