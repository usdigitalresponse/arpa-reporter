const express = require('express')
const { requireAdminUser, requireUser } = require('../access-helpers')

const router = express.Router()
const {
  agencies,
  createAgency,
  updateAgency
} = require('../db/agencies')

router.get('/', requireUser, function (req, res) {
  agencies().then(agencies => res.json({ agencies }))
})

async function validateAgency (agency) {
  if (!agency.name) {
    throw new Error('Agency requires a name')
  }
  if (!agency.code) {
    throw new Error('Agency requires a code')
  }
}

router.post('/', requireAdminUser, async function (req, res, next) {
  const agencyInfo = req.body.agency
  console.dir(agencyInfo)

  try {
    await validateAgency(agencyInfo)
  } catch (e) {
    res.status(400).json({ error: e.message })
    return
  }

  try {
    if (agencyInfo.id) {
      const agency = await updateAgency(agencyInfo)
      res.json({ agency })
    } else {
      const agency = await createAgency(agencyInfo)
      res.json({ agency })
    }
  } catch (e) {
    if (e.message.match(/violates unique constraint/)) {
      res.status(400).json({ error: 'Agency with that code already exists' })
    } else {
      res.status(500).json({ error: e.message })
    }
  }
})

module.exports = router
