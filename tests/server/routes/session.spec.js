
const { makeTestServer, getSessionCookie } = require('./route_test_helpers')

describe('/api/sessions', () => {
  const adminEmail = 'mbroussard+unit-test-admin@usdigitalresponse.org'
  let server
  let adminCookie
  before(async () => {
    server = makeTestServer()
    adminCookie = await getSessionCookie(adminEmail)
  })
  after(() => {
    server.stop()
  })

  it('shows logged out', async () => {
    await server
      .get('/api/sessions')
      .expect(200)
      .expect({ message: 'No session' })
  })
  it('shows logged in', async () => {
    const x = server
      .get('/api/sessions')

    await x
      .set('Cookie', adminCookie)
      .expect(200)
      .expect(res => {
        if (res.body?.user?.email !== adminEmail) {
          throw new Error('expected user email in response')
        }
      })
  })
})
