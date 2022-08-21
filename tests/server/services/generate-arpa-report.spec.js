const assert = require('assert')

const { generateReport } = require('../../../src/server/services/generate-arpa-report')
const { withTenantId } = require('../helpers/with-tenant-id')

describe('arpa report generation', function () {
  it('generates a report', async function () {
    const tenantId = 0
    const report = await withTenantId(tenantId, () => generateReport(1))
    assert.ok(report)
  })
})
