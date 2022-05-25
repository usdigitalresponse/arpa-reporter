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
    configuration: {},
    agencies: [],
    subrecipients: [],
    reportingPeriods: [],
    allReportingPeriods: [],
    messages: [],
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
    setConfiguration (state, configuration) {
      state.configuration = configuration
    },
    setAgencies (state, agencies) {
      state.agencies = agencies
    },
    setSubrecipients (state, subrecipients) {
      state.subrecipients = Object.freeze(subrecipients)
    },
    setReportingPeriods (state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods
    },
    setAllReportingPeriods (state, allReportingPeriods) {
      state.allReportingPeriods = allReportingPeriods
    },
    setApplicationSettings (state, applicationSettings) {
      state.applicationSettings = applicationSettings
      if (!state.viewPeriodID) {
        state.viewPeiodID = applicationSettings.current_reporting_period_id
      }
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
    addAgency (state, agency) {
      state.agencies = _.sortBy([...state.agencies, agency], 'name')
    },
    updateAgency (state, agency) {
      state.agencies = _.chain(state.agencies)
        .map(a => (agency.id === a.id ? agency : a))
        .sortBy('name')
        .value()
    },
    addMessage (state, message) {
      state.messages = [...state.messages, message]
    },
    setViewPeriodID (state, period_id) {
      state.viewPeriodID = period_id
    },
    addReportingPeriod (state, reportingPeriod) {
      state.allReportingPeriods = _.sortBy([...state.allReportingPeriods, reportingPeriod], 'start_date')
    },
    updateReportingPeriod (state, reportingPeriod) {
      state.reportingPeriods = _.chain(state.reportingPeriods)
        .map(r => (reportingPeriod.id === r.id ? reportingPeriod : r))
        .sortBy('start_date')
        .value()
      state.allReportingPeriods = _.chain(state.allReportingPeriods)
        .map(r => (reportingPeriod.id === r.id ? reportingPeriod : r))
        .sortBy('start_date')
        .value()
    },
    updateAllUploads (state, updatedUploads) {
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
    loadApplicationSettings ({ commit }) {
      fetch('/api/application_settings')
        .then(r => r.json())
        .then(data => {
          commit('setApplicationSettings', data.application_settings)
          commit('setViewPeriodID', data.application_settings.current_reporting_period_id)
        })
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
    },
    createTemplate ({ commit }, { reportingPeriodId, formData }) {
      return postForm(`/api/reporting_periods/${reportingPeriodId}/template`, formData)
        .then(r => {
          if (!r.ok) { throw new Error(`createTemplate: ${r.statusText} (${r.status})`) }
          return r.json()
        })
        .then(response => {
          if (response.success && response.reportingPeriod) {
            commit('updateReportingPeriod', response.reportingPeriod)
            fetch('/api/application_settings', { credentials: 'include' })
              .then(r => r.json())
              .then(data => commit('setApplicationSettings', data.application_settings))
          }
          return response
        })
    },
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
    },
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
    setViewPeriodID ({ commit }, period_id) {
      commit('setViewPeriodID', period_id)
    },
    closeReportingPeriod ({ commit }, period_id) {
      return fetch('/api/reporting_periods/close', { credentials: 'include', method: 'POST' })
        .then(r => {
          if (r.ok) {
            fetch('/api/reporting_periods', { credentials: 'include' })
              .then(r => r.json())
              .then(data => commit('setReportingPeriods', data.reporting_periods))
            fetch('/api/application_settings', { credentials: 'include' })
              .then(r => r.json())
              .then(data => commit('setApplicationSettings', data.application_settings))
          }
          return r
        })
    },
    createReportingPeriod ({ commit }, reportingPeriod) {
      return post('/api/reporting_periods', reportingPeriod).then(response => {
        const r = {
          ...reportingPeriod,
          ...response.reportingPeriod
        }
        r.start_date = moment(r.start_date).format()
        r.end_date = moment(r.end_date).format()
        commit('addReportingPeriod', r)
      })
    },
    updateReportingPeriod ({ commit }, reportingPeriod) {
      reportingPeriod.start_date = moment(reportingPeriod.start_date).format()
      reportingPeriod.end_date = moment(reportingPeriod.end_date).format()
      return put(`/api/reporting_periods/${reportingPeriod.id}`, reportingPeriod).then(() => {
        commit('updateReportingPeriod', reportingPeriod)
      })
    },

    async updateUploads ({ commit, state }) {
      const params = new URLSearchParams({ period_id: state.viewPeriodID })
      const result = await getJson('/api/uploads?' + params.toString())

      if (result.error) {
        commit('addAlert', { text: `updateUploads Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('updateAllUploads', result.uploads)
      }
    },
    async updateAgencies ({ commit, state }) {
      const result = await getJson('/api/agencies')
      if (result.error) {
        commit('addAlert', { text: `updateAgencies Error: ${result.error} (${result.text})`, level: 'err' })
      } else {
        commit('setAgencies', result.agencies)
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
    currentReportingPeriod: state => {
      const id = state.applicationSettings.current_reporting_period_id
      if (!id) {
        return null
      }
      return _.find(state.reportingPeriods, { id })
    },
    viewPeriod: state => {
      const id = Number(state.viewPeriodID ||
      state.applicationSettings.current_reporting_period_id
      )

      return _.find(state.reportingPeriods, { id }) || { id: 0, name: '' }
    },
    currentPeriodID: state => {
      return Number(state.applicationSettings.current_reporting_period_id)
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    viewPeriodIsCurrent: state => {
      return Number(state.viewPeriodID) ===
        Number(state.applicationSettings.current_reporting_period_id)
    }
  }
})
