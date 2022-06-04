import { expect } from 'chai'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import Navigation from '@/components/Navigation.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Navigation.vue', () => {
  let store
  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        users: {
          user: ({ email: 'user@example.com', role: 'admin' })
        },
        alerts: {
          alerts: {}
        }
      },
      getters: {
        'reportingPeriods/periodNames': () => ['September, 2020', 'December, 2020'],
        'reportingPeriods/viewPeriod': () => ({ id: 1 }),
        'users/loggedInUser': state => state.users.user,
        'applicationSettings/applicationTitle': () => 'ARPA Reporter',
        'agencies/agencyName': () => id => `Agency ${id}`
      }
    })
  })

  it('renders the nav element', () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const navbars = wrapper.findAll('nav.navbar')
    expect(navbars.length).to.equal(1) // has one navbar element

    const navs = wrapper.findAll('ul.nav')
    expect(navs.length).to.equal(1) // has one nav element
  })

  it('include title', () => {
    const wrapper = shallowMount(Navigation, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const r = wrapper.find('a.navbar-brand')
    expect(r.text()).to.include('ARPA Reporter')
  })
})
