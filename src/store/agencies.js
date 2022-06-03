
import _ from 'lodash'

import { getJson, post, put } from './ajax'

export default {
  namespaced: true,
  state: {
    agencies: []
  },
  mutations: {
    setAgencies (state, agencies) {
      state.agencies = agencies
    },
    addAgency (state, agency) {
      state.agencies = _.sortBy([...state.agencies, agency], 'name')
    },
    updateAgency (state, agency) {
      state.agencies = _.chain(state.agencies)
        .map(a => (agency.id === a.id ? agency : a))
        .sortBy('name')
        .value()
    }
  },
  actions: {
    createAgency ({ commit }, agency) {
      return post('/api/agencies', agency).then(response => {
        commit('addAgency', response.agency)
      })
    },
    updateAgency ({ commit }, agency) {
      return put(`/api/agencies/${agency.id}`, agency).then(() => {
        commit('updateAgency', agency)
      })
    },
    async updateAgencies ({ commit, state }) {
      const result = await getJson('/api/agencies')
      if (result.error) {
        commit('addAlert', { text: `updateAgencies Error: ${result.error} (${result.text})`, level: 'err' }, { root: true })
      } else {
        commit('setAgencies', result.agencies)
      }
    }
  },
  getters: {
    agencyName: state => id => {
      const agency = _.find(state.agencies, { id })
      return agency ? agency.name : ''
    }
  }
}
