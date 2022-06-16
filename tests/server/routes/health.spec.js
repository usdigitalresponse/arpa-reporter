
const { makeTestServer } = require('./route_test_helpers')

describe('/api/health', () => {
  let server
  before(() => {
    server = makeTestServer()
  })
  after(() => {
    server.stop()
  })

  // This is an admittedly dumb thing to test, it's really just here to validate
  // supertest works properly.
  it('returns 200', async () => {
    await server
      .get('/api/health')
      .expect(200)
      .expect({ success: true, db: 'OK' })
  })
})
