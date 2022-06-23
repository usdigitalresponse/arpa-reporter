
const settings = requireSrc(__filename)
const assert = require('assert')

const TENANT_A = 0
const TENANT_B = 1

describe('application settings db', function () {
  describe('applicationSettings', function () {
    it('Returns the current reporting period & title', async () => {
      const a = await settings.applicationSettings(TENANT_A)
      assert.equal(a.current_reporting_period_id, 1)
      assert.equal(a.title, 'Rhode Island')

      const b = await settings.applicationSettings(TENANT_B)
      assert.equal(b.current_reporting_period_id, 22)
      assert.equal(b.title, 'California')
    })
  })

  describe('setCurrentReportingPeriod', function () {
    let savedReportingPeriod

    beforeEach('save current period', async function () {
      const curr = await settings.applicationSettings(TENANT_A)
      savedReportingPeriod = curr.current_reporting_period_id
    })

    afterEach('restore reporting period', async function () {
      await settings.setCurrentReportingPeriod(TENANT_A, savedReportingPeriod)
    })

    it('Changes the current reporting period', async () => {
      await settings.setCurrentReportingPeriod(TENANT_A, 2)

      const result = await settings.applicationSettings(TENANT_A)
      assert.equal(result.current_reporting_period_id, 2)
    })

    it('Only changes the current reporting period for the specified tenant', async () => {
      await settings.setCurrentReportingPeriod(TENANT_A, 2)

      const a = await settings.applicationSettings(TENANT_A)
      assert.equal(a.current_reporting_period_id, 2)

      const b = await settings.applicationSettings(TENANT_B)
      assert.equal(b.current_reporting_period_id, 22)
    })
  })
})
