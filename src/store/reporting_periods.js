
import moment from 'moment'
import _ from 'lodash'

import { post, put, postForm } from './ajax'

export default {
  namespaced: true,
  state: {
    viewPeriodID: null,
    reportingPeriods: [],
    allReportingPeriods: []
  },
  mutations: {
    setViewPeriodID (state, periodId) {
      state.viewPeriodID = periodId
    },
    setReportingPeriods (state, reportingPeriods) {
      state.reportingPeriods = reportingPeriods
    },
    setAllReportingPeriods (state, allReportingPeriods) {
      state.allReportingPeriods = allReportingPeriods
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
    }
  },
  actions: {
    setViewPeriodID ({ commit }, periodId) {
      commit('setViewPeriodID', periodId)
    },
    createTemplate ({ commit, dispatch }, { reportingPeriodId, formData }) {
      return postForm(`/api/reporting_periods/${reportingPeriodId}/template`, formData)
        .then(r => {
          if (!r.ok) { throw new Error(`createTemplate: ${r.statusText} (${r.status})`) }
          return r.json()
        })
        .then(response => {
          if (response.success && response.reportingPeriod) {
            commit('updateReportingPeriod', response.reportingPeriod)
            dispatch('applicationSettings/reloadApplicationSettings', { root: true })
          }
          return response
        })
    },
    closeReportingPeriod ({ commit, dispatch }) {
      return fetch('/api/reporting_periods/close', { credentials: 'include', method: 'POST' })
        .then(r => {
          if (r.ok) {
            fetch('/api/reporting_periods', { credentials: 'include' })
              .then(r => r.json())
              .then(data => commit('setReportingPeriods', data.reporting_periods))
            dispatch('applicationSettings/reloadApplicationSettings', { root: true })
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
    loadReportingPeriods ({ commit }) {
      return fetch('/api/reporting_periods', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          commit('setReportingPeriods', data.reporting_periods)
          commit('setAllReportingPeriods', data.all_reporting_periods)
        })
    }
  },
  getters: {
    currentReportingPeriod: (state, getters, rootState, rootGetters) => {
      const id = rootGetters['applicationSettings/currentPeriodID']
      if (!id) {
        return null
      }
      return _.find(state.reportingPeriods, { id })
    },
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
    },
    viewPeriod: (state, getters, rootState, rootGetters) => {
      const id = Number(state.viewPeriodID ||
      rootGetters['applicationSettings/currentPeriodID']
      )

      return _.find(state.reportingPeriods, { id }) || { id: 0, name: '' }
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    viewPeriodIsCurrent: (state, getters, rootState, rootGetters) => {
      return Number(state.viewPeriodID) ===
        Number(rootGetters['applicationSettings/currentPeriodID'])
    }
  }
}
