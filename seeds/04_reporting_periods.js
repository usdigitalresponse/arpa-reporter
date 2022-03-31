require('dotenv').config()

/*
   reporting periods loosely based on tables 3 and 4 from here:
   https://home.treasury.gov/system/files/136/SLFRF-Compliance-and-Reporting-Guidance.pdf
*/
exports.seed = async function (knex) {
  const [{ count }] = await knex('reporting_periods').count('name', { as: 'count' })
  if (count !== '0') {
    console.log(`db already has ${count} reporting periods...`)
    return
  }

  await knex('reporting_periods').insert([
    {
      name: 'Quarterly 1',
      start_date: '2021-03-03',
      end_date: '2021-12-31',
      period_of_performance_end_date: '2021-12-31',
      open_date: '2022-01-01',
      close_date: '2022-01-31',
      review_period_start_date: '2022-01-16',
      review_period_end_date: '2022-01-31',
      crf_end_date: '2021-09-30'
    },
    {
      name: 'Quarterly 2',
      start_date: '2022-01-01',
      end_date: '2022-03-31',
      period_of_performance_end_date: '2022-03-31',
      open_date: '2022-04-01',
      close_date: '2022-04-30',
      review_period_start_date: '2022-04-16',
      review_period_end_date: '2022-04-30',
      crf_end_date: '2021-09-30'
    },
    {
      name: 'Quarterly 3',
      start_date: '2022-04-01',
      end_date: '2022-06-30',
      period_of_performance_end_date: '2022-06-30',
      open_date: '2022-07-01',
      close_date: '2022-07-31',
      review_period_start_date: '2022-07-16',
      review_period_end_date: '2022-07-31',
      crf_end_date: '2021-09-30'
    },
    {
      name: 'Annual 1',
      start_date: '2021-03-03',
      end_date: '2022-03-31',
      period_of_performance_end_date: '2022-03-31',
      open_date: '2022-04-01',
      close_date: '2022-04-30',
      review_period_start_date: '2022-04-16',
      review_period_end_date: '2022-04-30',
      crf_end_date: '2022-04-30'
    },
    {
      name: 'Annual 2',
      start_date: '2022-04-01',
      end_date: '2023-03-31',
      period_of_performance_end_date: '2023-03-31',
      open_date: '2023-04-01',
      close_date: '2023-04-30',
      review_period_start_date: '2023-04-16',
      review_period_end_date: '2023-04-30',
      crf_end_date: '2023-04-30'
    }
  ])
    .returning('id')
}
