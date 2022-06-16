const { userAndRole } = require('./db/users')

function requireUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    next()
  }
}

function requireAdminUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      if (user.role !== 'admin') {
        res.sendStatus(403)
      } else {
        next()
      }
    })
  }
}

module.exports = { requireAdminUser, requireUser }
