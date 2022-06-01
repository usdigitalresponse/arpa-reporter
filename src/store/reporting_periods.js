
import moment from 'moment'
import _ from 'lodash'

import { post, put, postForm } from './ajax'

export default {
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
            dispatch('reloadApplicationSettings')
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
            dispatch('reloadApplicationSettings')
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
    }
  },
  getters: {
    currentReportingPeriod: (state, getters) => {
      const id = getters.currentPeriodID
      if (!id) {
        return null
      }
      return _.find(state.reportingPeriods, { id })
    },
    periodNames: state => {
      return _.map(state.reportingPeriods, 'name')
    },
    viewPeriod: (state, getters) => {
      const id = Number(state.viewPeriodID ||
      getters.currentPeriodID
      )

      return _.find(state.reportingPeriods, { id }) || { id: 0, name: '' }
    },
    viewPeriodID: state => {
      return Number(state.viewPeriodID)
    },
    viewPeriodIsCurrent: (state, getters) => {
      return Number(state.viewPeriodID) ===
        Number(getters.currentPeriodID)
    }
  }
}
