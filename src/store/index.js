/* eslint camelcase: 0 */

import Vue from 'vue'
import Vuex from 'vuex'
import moment from 'moment'
import _ from 'lodash'

Vue.use(Vuex)

export function get (url) {
  const options = {
    credentials: 'include'
  }
  return fetch(url, options)
}

// this function always returns an object. in case of success, the object is
// the JSON sent by the server. in case of any errors, the `error` property
// contains a description of the error.
export async function getJson (url) {
  let resp
  try {
    resp = await fetch(url)
  } catch (e) {
    return { error: e, status: null }
  }

  if (resp.ok) {
    const text = await resp.text()
    let json
    try {
      json = JSON.parse(text)
    } catch (e) {
      json = { error: 'Server sent invalid JSON response', text }
    }

    json.status = resp.status
    return json
  } else {
    return { error: `Server error ${resp.status} (${resp.statusText})`, status: resp.status }
  }
}

export function post (url, body) {
  const options = {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

export function postForm (url, formData) {
  const options = {
    method: 'POST',
    credentials: 'include',
    body: formData
  }
  return fetch(url, options)
}

export function put (url, body) {
  const options = {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  return fetch(url, options).then(r => {
    if (r.ok) {
      return r.json()
    }
    return r
      .text()
      .then(text => Promise.reject(new Error(text || r.statusText)))
  })
}

function randomId () {
  return Math.random().toString(16).substr(2, 10)
}

export default new Vuex.Store({
  state: {
    user: null,
    applicationSettings: {},
    roles: [],
    users: [],
    agencies: [],
    reportingPeriods: [],
    viewPeriodID: null,

    recentUploadId: null,
    allUploads: [],
    alerts: {}
  },
  mutations: {
    setRecentUploadId (state, uploadId) {
      state.recentUploadId = uploadId
    },
    setUser (state, user) {
      state.user = user
    },
    setAgencies (state, agencies) {
      state.agencies = agencies
    },
    setRoles (state, roles) {
      state.roles = roles
    },
    setUsers (state, users) {
      state.users = users
      if (state.user) {
        const updatedUser = users.find(u => u.id === state.user.id)
        state.user = updatedUser
      }
    },
    setReportingPeriods (state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods
    },
    setApplicationSettings (state, applicationSettings) {
      state.applicationSettings = applicationSettings
      if (!state.viewPeriodID) {
        state.viewPeriodID = applicationSettings.current_reporting_period_id
      }
    },
    setViewPeriodID (state, period_id) {
      state.viewPeriodID = period_id
    },
    setAllUploads (state, updatedUploads) {
      state.allUploads = updatedUploads
    },
    addAlert (state, alert) {
      Vue.set(state.alerts, randomId(), alert)
    },
    dismissAlert (state, alertId) {
      Vue.delete(state.alerts, alertId)
    }
  },
  actions: {
    login: async function ({ commit, dispatch }, user) {
      commit('setUser', user)

      // to ensure consistent application state, lets block rendering until these complete
      await Promise.all([
        dispatch('updateApplicationSettings'),
        dispatch('updateReportingPeriods'),
        dispatch('updateAgencies'),
        dispatch('updateUsersRoles')
      ])
    },
    logout ({ commit }) {
      fetch('/api/sessions/logout').then(() => commit('setUser', null))
    },
    createTemplate ({ commit, dispatch }, { reportingPeriodId, formData }) {
      return postForm(`/api/reporting_periods/${reportingPeriodId}/template`, formData)
        .then(r => {
          if (!r.ok) { throw new Error(`createTemplate: ${r.statusText} (${r.status})`) }
          return r.json()
        })
        .then(response => {
          if (response.success) {
            dispatch('updateReportingPeriods')
            dispatch('updateApplicationSettings')
          }
          return response
        })
    },
    setViewPeriodID ({ commit }, period_id) {
      commit('setViewPeriodID', period_id)
    },
    closeReportingPeriod ({ commit, dispatch }, period_id) {
      return fetch('/api/reporting_periods/close', { credentials: 'include', method: 'POST' })
        .then(r => {
          if (r.ok) {
            dispatch('updateReportingPeriods')
            dispatch('updateApplicationSettings')
          }
          return r
        })
    },

    async updateUploads ({ commit, state }) {
      const params = new URLSearchParams({ period_id: state.viewPeriodID })
      const result = await getJson('/api/uploads?' + params.toString())

      if (result.error) {
        commit('addAlert', { text: `updateUploads Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setAllUploads', result.uploads)
      }
    },
    async updateAgencies ({ commit, state }) {
      const result = await getJson('/api/agencies')
      if (result.error) {
        commit('addAlert', { text: `updateAgencies Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setAgencies', result.agencies)
      }
    },
    async updateReportingPeriods ({ commit, state }) {
      const result = await getJson('/api/reporting_periods')
      if (result.error) {
        commit(
          'addAlert',
          { text: `updateReportingPeriods Error: ${result.error} (${result.text})`, level: 'err' }
        )
      } else {
        commit('setReportingPeriods', result.reportingPeriods)
      }
    },
    async updateUsersRoles ({ commit, state }) {
      const result = await getJson('/api/users')
      if (result.error) {
        commit('addAlert', { text: `updateUsersRoles Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setRoles', result.roles)
        commit('setUsers', result.users)
      }
    },
    async updateApplicationSettings ({ commit }) {
      const result = await getJson('/api/application_settings')
      if (result.error) {
        const text = `updateApplicationSettings Error: ${result.error} (${result.text})`
        commit('addAlert', { text, level: 'err' })
      } else {
        commit('setApplicationSettings', result.application_settings)
        commit('setViewPeriodID', result.application_settings.current_reporting_period_id)
      }
    }
  },
  modules: {},
  getters: {
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
    },
    user: state => {
      return state.user || {}
    },
    agencyName: state => id => {
      const agency = _.find(state.agencies, { id })
      return agency ? agency.name : ''
    },
    applicationTitle: state => {
      const title = _.get(state, 'applicationSettings.title', '')
      return title || 'ARPA Reporter'
    },
    currentPeriodID: state => {
      return Number(state.applicationSettings.current_reporting_period_id)
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    viewPeriodIsCurrent: (state, getters) => {
      return getters.viewPeriodID === getters.currentPeriodID
    },
    currentReportingPeriod: (state, getters) => {
      return state.reportingPeriods.find(period => period.id === getters.currentPeriodID)
    },
    viewPeriod: (state, getters) => {
      return state.reportingPeriods.find(period => period.id === getters.viewPeriodID)
    },
    viewableReportingPeriods: state => {
      const now = moment()
      return state.reportingPeriods.filter(period => moment(period.start_date) <= now)
    },
    roles: state => {
      return state.roles
    }
  }
})
