
const path = require('path')

const express = require('express')
const supertest = require('supertest')

const configureAPI = requireSrc(path.resolve(__dirname, '../configure'))

const makeTestServer = () => {
  const app = express()
  configureAPI(app, {
    // The normal request logging from Morgan just clutters Mocha's test runner output
    disableRequestLogging: true
  })
  const server = app.listen(0)
  const tester = supertest(server)

  if ('stop' in tester) {
    throw new Error('makeTestServer adds a stop method and expects Supertest not to have its own')
  }

  // We wrap Supertest's object in a proxy because they have inconsistent behavior around closing
  // server sockets (autoclose when calling end(), but not when using async/await) -- so instead we
  // manage the server socket ourselves and provide an extra method to close it.
  //
  // Intended use is makeTestServer is called in before/beforeEach and stop is called in
  // after/afterEach
  return new Proxy(tester, {
    get: function (target, prop, receiver) {
      if (prop === 'stop') {
        return () => server.close()
      }

      return Reflect.get(target, prop, receiver)
    }
  })
}

module.exports = { makeTestServer }
