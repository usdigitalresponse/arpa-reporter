const assert = require('assert')

const arpa = require('../../../src/server/services/generate-arpa-report')

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const report = await arpa.generateReport(0)
    assert.ok(report)
  })
})
