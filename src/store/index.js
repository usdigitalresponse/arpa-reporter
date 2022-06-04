/* eslint camelcase: 0 */

import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

import users from './users'
import applicationSettings from './application_settings'
import reportingPeriods from './reporting_periods'
import agencies from './agencies'
import uploads from './uploads'
import { post, put } from './ajax'

export * from './ajax'

Vue.use(Vuex)

function randomId () {
  return Math.random().toString(16).substr(2, 10)
}

export default new Vuex.Store({
  modules: {
    users,
    applicationSettings,
    reportingPeriods,
    agencies,
    uploads
  },
  state: {
    subrecipients: [],
    alerts: {}
  },
  mutations: {
    setSubrecipients (state, subrecipients) {
      state.subrecipients = Object.freeze(subrecipients)
    },
    addSubrecipient (state, subrecipient) {
      state.subrecipients = _.sortBy([...state.subrecipients, subrecipient], 'name')
    },
    updateSubrecipient (state, subrecipient) {
      state.subrecipients = _.chain(state.subrecipients)
        .map(s => (subrecipient.id === s.id ? subrecipient : s))
        .sortBy('name')
        .value()
    },
    addAlert (state, alert) {
      Vue.set(state.alerts, randomId(), alert)
    },
    dismissAlert (state, alertId) {
      Vue.delete(state.alerts, alertId)
    }
  },
  actions: {
    createSubrecipient ({ commit }, subrecipient) {
      return post('/api/subrecipients', subrecipient).then(response => {
        const s = {
          ...subrecipient,
          ...response.subrecipient
        }
        commit('addSubrecipient', s)
      })
    },
    updateSubrecipient ({ commit }, subrecipient) {
      return put(`/api/subrecipients/${subrecipient.id}`, subrecipient).then(() => {
        commit('updateSubrecipient', subrecipient)
      })
    }
  }
})
