require('dotenv').config()

const usdrAdmins = [
  { email: 'igor47@moomers.org', name: 'Igor Serebryany', tenant_id: 0 },
  { email: 'ajhyndman@hotmail.com', name: 'Andrew Hyndman', tenant_id: 0 },
  { email: 'joecomeau01@gmail.com', name: 'Joe Comeau', tenant_id: 0 },
  { email: 'trumancranor@gmail.com', name: 'Truman Cranor', tenant_id: 0 },
  { email: 'mhuang@usdigitalresponse.org', name: 'Mindy Huang', tenant_id: 0 }
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
