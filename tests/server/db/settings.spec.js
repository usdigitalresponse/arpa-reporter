
const settings = requireSrc(__filename)
const assert = require('assert')

describe('application settings db', function () {
  describe('currentReportingPeriodSettings', function () {
    it('Returns the current reporting period & title', async () => {
      const result = await settings.currentReportingPeriodSettings()

      assert.equal(result.current_reporting_period_id, 1)
      assert.equal(result.title, 'Rhode Island')
    })
  })

  describe('setCurrentReportingPeriod', function () {
    let savedReportingPeriod

    beforeEach('save current period', async function () {
      const curr = await settings.currentReportingPeriodSettings()
      savedReportingPeriod = curr.current_reporting_period_id
    })

    afterEach('restore reporting period', async function () {
      await settings.setCurrentReportingPeriod(savedReportingPeriod)
    })

    it('Changes the current reporting period', async () => {
      await settings.setCurrentReportingPeriod(2)

      const result = await settings.currentReportingPeriodSettings()
      assert.equal(result.current_reporting_period_id, 2)
    })
  })
})
