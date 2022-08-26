const { userAndRole } = require('./db/users')

function requireUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      req.session = { ...req.session, user }
      next()
    }).catch(e => next(e))
  }
}

function requireAdminUser (req, res, next) {
  if (!req.signedCookies.userId) {
    res.sendStatus(403)
  } else {
    userAndRole(req.signedCookies.userId).then(user => {
      if (user.role.name !== 'admin') {
        res.sendStatus(403)
      } else {
        req.session = { ...req.session, user }
        next()
      }
    }).catch(e => next(e))
  }
}

module.exports = { requireAdminUser, requireUser }
