require('dotenv').config()

// reporting periods loosely based on tables 3 and 4 from here:
// https://home.treasury.gov/system/files/136/SLFRF-Compliance-and-Reporting-Guidance.pdf
//
// when making changes to this file, consider also updating the test seed:
// tests/server/seeds/07_reporting_periods.js
exports.seed = async function (knex) {
  const [{ count }] = await knex('reporting_periods').count('name', { as: 'count' })
  if (count !== '0') {
    console.log(`db already has ${count} reporting periods...`)
    return
  }

  // first period is all of 2021
  const periods = [
    {
      name: 'Quarterly 1',
      start_date: '2021-03-03',
      end_date: '2021-12-31',
      open_date: '2022-01-01',
      close_date: '2022-01-31'
    }
  ]

  const moment = require('moment')
  const mstr = (mdate) => mdate.format('YYYY-MM-DD')

  // generate array of reporting periods, starting from right after the first period
  const start = moment(periods[0].end_date).add(1, 'days')
  const finalStart = moment('2026-10-01')
  while (!start.isAfter(finalStart)) {
    const end = start.clone().add(2, 'months').endOf('month')
    const open = end.clone().add(1, 'days')

    // according to treasury, final reporting period closes end of march, not end of january
    const close = start.isSame(finalStart) ? moment('2027-03-31') : open.clone().endOf('month')

    periods.push({
      name: `Quarterly ${periods.length + 1}`,
      start_date: mstr(start),
      end_date: mstr(end),
      open_date: mstr(open),
      close_date: mstr(close)
    })

    start.add(3, 'months')
  }

  // not sure what these fields are used for; these might be unnecessary
  periods.forEach(period => {
    period.period_of_performance_end_date = period.end_date
    period.review_period_start_date = mstr(moment(period.open_date).add(2, 'weeks'))
    period.review_period_end_date = period.close_date
    period.crf_end_date = period.close_date
  })

  await knex('reporting_periods').insert(periods)
}
