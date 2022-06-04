import { expect } from 'chai'
import { mount, createLocalVue } from '@vue/test-utils'
import Uploads from '@/views/Uploads.vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Uploads.vue', () => {
  it('renders', () => {
    const store = new Vuex.Store({
      state: {
        agencies: {
          agencies: []
        },
        uploads: {
          allUploads: []
        },
        reportingPeriods: {
          viewPeriodID: null
        }
      },
      getters: {
        'reportingPeriods/periodNames': () => ['September, 2020', 'December, 2020'],
        'agencies/agencyName': () => () => 'Test Agency'
      }
    })

    const wrapper = mount(Uploads, {
      store,
      localVue,
      stubs: ['router-link']
    })
    expect(wrapper.text()).to.include('No uploads')
  })
})
