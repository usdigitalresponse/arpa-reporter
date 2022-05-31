/* eslint camelcase: 0 */

import Vue from 'vue'
import Vuex from 'vuex'
import moment from 'moment'
import _ from 'lodash'

import users from './users'
import { getJson, post, postForm, put } from './ajax'

export * from './ajax'

Vue.use(Vuex)

function randomId () {
  return Math.random().toString(16).substr(2, 10)
}

export default new Vuex.Store({
  modules: {
    users
  },
  state: {
    applicationSettings: {},
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
    loadApplicationSettings ({ commit }) {
      fetch('/api/application_settings')
        .then(r => r.json())
        .then(data => {
          commit('setApplicationSettings', data.application_settings)
          commit('setViewPeriodID', data.application_settings.current_reporting_period_id)
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
  getters: {
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
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
