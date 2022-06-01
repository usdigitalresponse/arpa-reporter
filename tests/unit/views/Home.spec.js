import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Home from '@/views/Home.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Home.vue', () => {
  it('renders', () => {
    const store = new Vuex.Store({
      state: {
        // TODO(mbroussard): fixup this test to look like namespaced version
        viewPeriodID: 0,
        configuration: {
          templates: [{ name: 'Agency' }]
        }
      },
      getters: {
        user: () => ({ email: 'admin@example.com', role: 'admin' }),
        // TODO(mbroussard): update tests to look like namespaced version
        periodNames: () => ['September, 2020', 'December, 2020']
      }
    })
    const wrapper = mount(Home, {
      store,
      localVue,
      stubs: ['router-link', 'router-view']
    })
    const r = wrapper.find('p')
    expect(r.text()).to.include('Welcome')
  })
})
