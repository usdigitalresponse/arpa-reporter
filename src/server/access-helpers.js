const { userAndRole } = require('./db/users')

function requireUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      req.session = { ...req.session, user }
      next()
    })
  }
}

function requireAdminUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      console.log('user:', user)
      if (user.role !== 'admin') {
        res.sendStatus(403)
      } else {
        req.session = { ...req.session, user }
        next()
      }
    })
  }
}

module.exports = { requireAdminUser, requireUser }
