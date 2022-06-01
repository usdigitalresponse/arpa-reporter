
import _ from 'lodash'

import { post, put } from './ajax'

export default {
  namespaced: true,
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
      dispatch('applicationSettings/loadApplicationSettings', null, { root: true })
      dispatch('updateAgencies', null, { root: true })

      // root: whether the needed mutation is at the root level of the store or
      // nested within this module. This is probably temporary and we should probably
      // just get rid of this dynamic computation of mutation names...
      const doFetch = (attr, root = true) => {
        fetch(`/api/${attr}`, { credentials: 'include' })
          .then(r => r.json())
          .then(data => {
            const mutation = _.camelCase(`set_${attr}`)
            commit(mutation, data[attr], { root })
            if (attr === 'reporting_periods') { // yuck
              commit('setAllReportingPeriods', data.all_reporting_periods, { root })
            }
          })
      }
      doFetch('configuration', false /* root */)
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
    loggedInUser: state => state.user || {}
  }
}
