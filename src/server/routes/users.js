/* eslint camelcase: 0 */

const express = require('express')
const router = express.Router()
const { requireUser, requireAdminUser } = require('../access-helpers')
const { createUser, user: getUser, users: listUsers, updateUser } = require('../db/users')
const { agencyById } = require('../db/agencies')
const { sendWelcomeEmail } = require('../lib/email')
const _ = require('lodash-checkit')

async function validateUser (req, res, next) {
  const { email, role, agency_id } = req.body
  if (!email) {
    res.status(400).send('User email is required')
    return
  }
  if (!_.isEmail(email)) {
    res.status(400).send('Invalid email address')
    return
  }
  if (!role) {
    res.status(400).send('Role required')
    return
  }
  if (agency_id) {
    const agency = await agencyById(agency_id)
    if (!agency) {
      res.status(400).send('Invalid agency')
      return
    }
  } else if (role !== 'admin') {
    res.status(400).send('Reporter role requires agency')
    return
  }
  next()
}

router.get('/', requireUser, async function (req, res, next) {
  const allUsers = await listUsers()
  const curUser = allUsers.find(u => u.id === Number(req.signedCookies.userId))

  let users
  if (curUser.role === 'admin') {
    if (curUser.agency_id) {
      users = allUsers.filter(u => u.agency_id === curUser.agency_id)
    } else {
      users = allUsers
    }
  } else {
    users = [curUser]
  }

  res.json({ users })
})

router.post('/', requireAdminUser, validateUser, async function (
  req,
  res,
  next
) {
  console.log('POST /users', req.body)
  const { email, name, role, agency_id } = req.body
  const user = {
    email: email.toLowerCase().trim(),
    role,
    name,
    agency_id
  }
  createUser(user)
    .then(result => res.json({ user: result }))
    .then(() => sendWelcomeEmail(user.email, req.headers.origin))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send('User with that email already exists')
      } else {
        next(e)
      }
    })
})

router.put('/:id', requireAdminUser, validateUser, async function (
  req,
  res,
  next
) {
  console.log('PUT /users/:id', req.body)
  let user = await getUser(req.params.id)
  if (!user) {
    res.status(400).send('User not found')
    return
  }
  const { email, name, role, agency_id } = req.body
  user = {
    ...user,
    email: email.toLowerCase().trim(),
    name,
    role,
    agency_id
  }
  updateUser(user)
    .then(result => res.json({ user: result }))
    .catch(e => {
      if (e.message.match(/violates unique constraint/)) {
        res.status(400).send('User with that email already exists')
      } else {
        next(e)
      }
    })
})

module.exports = router
