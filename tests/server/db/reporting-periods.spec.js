/*
--------------------------------------------------------------------------------
-                     tests/db/reporting-periods.spec.js
--------------------------------------------------------------------------------
  A reporting_periods record in postgres looks like this:

               Column             |           Type           |
  --------------------------------+--------------------------+
   id                             | integer                  |
   name                           | text                     |
   start_date                     | date                     |
   end_date                       | date                     |
   period_of_performance_end_date | date                     |
   certified_at                   | timestamp with time zone |
   certified_by                   | text                     |
   reporting_template             | text                     |
   validation_rule_tags           | text[]                   |
   open_date                      | date                     |
   close_date                     | date                     |
   review_period_start_date       | date                     |
   review_period_end_date         | date                     |

*/

const { getAllReportingPeriods, getReportingPeriod } = requireSrc(__filename)
const assert = require('assert')

describe('db/reporting-periods.js', function () {
  describe('getAll', function () {
    it('Returns a list of reporting periods', async function () {
      const result = await getAllReportingPeriods()
      assert.equal(result.length, 21)
    })
  })

  describe('get', function () {
    describe('when a specific id is passed', function () {
      it('Returns that reporting period', async function () {
        const result = await getReportingPeriod(2)
        assert.equal(result.id, 2)
      })
    })

    describe('when an invalid id is passed', function () {
      it('returns null', async function () {
        assert.equal((await getReportingPeriod('')), null)
        assert.equal((await getReportingPeriod(null)), null)
        assert.equal((await getReportingPeriod(12356)), null)
      })
    })

    it('returns the current reporting period', async function () {
      const result = await getReportingPeriod()
      assert.equal(result.id, 1)
      assert.equal(result.title, undefined)
    })
  })

  describe('close', function () {
    it.skip('Closes a reporting period', async () => {
      // skipped because the reporting period close test is in
      // period-summaries.spec.js
    })
  })
})
