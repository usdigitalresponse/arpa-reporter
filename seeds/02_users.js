require('dotenv').config()

const usdrAdmins = [
  { email: 'igor47@moomers.org', name: 'Igor Serebryany' },
  { email: 'ajhyndman@hotmail.com', name: 'Andrew Hyndman' },
  { email: 'joecomeau01@gmail.com', name: 'Joe Comeau' }
]

exports.seed = async function (knex) {
  usdrAdmins.forEach(async adm => {
    adm.role = 'admin'

    const [{ count }] = await knex('users')
      .where({ email: adm.email })
      .count('email', { as: 'count' })

    if (count === '0') {
      console.log(`adding user ${adm.email}...`)
      await knex('users').insert(adm)
    }
  })
}
