
import _ from 'lodash'

import { post, put } from './ajax'

export default {
  state: () => ({
    user: null,
    configuration: {}
  }),
  mutations: {
    setUser (state, user) {
      state.user = user
    },
    setConfiguration (state, configuration) {
      state.configuration = configuration
    },
    addUser (state, user) {
      state.configuration.users = _.sortBy(
        [...state.configuration.users, user],
        'email'
      )
    },
    updateUser (state, user) {
      state.configuration.users = _.chain(state.configuration.users)
        .map(u => (user.id === u.id ? user : u))
        .sortBy('email')
        .value()
    }
  },
  actions: {
    login ({ commit, dispatch }, user) {
      commit('setUser', user)
      dispatch('loadApplicationSettings')
      dispatch('updateAgencies')

      const doFetch = attr => {
        fetch(`/api/${attr}`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const mutation = _.camelCase(`set_${attr}`)
            commit(mutation, data[attr])
            if (attr === 'reporting_periods') { // yuck
              commit('setAllReportingPeriods', data.all_reporting_periods)
            }
          })
      }
      doFetch('configuration')
      doFetch('reporting_periods')
      doFetch('subrecipients')
    },
    logout ({ commit }) {
      fetch('/api/sessions/logout').then(() => commit('setUser', null))
    },
    createUser ({ commit }, user) {
      return post('/api/users', user).then(response => {
        commit('addUser', response.user)
      })
    },
    updateUser ({ commit }, user) {
      return put(`/api/users/${user.id}`, user).then(() => {
        commit('updateUser', user)
      })
    }
  },
  getters: {
    user: state => {
      return state.user || {}
    }
  }
}
