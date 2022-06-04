
import Vue from 'vue'

function randomId () {
  return Math.random().toString(16).substr(2, 10)
}

export default {
  namespaced: true,
  state: {
    alerts: {}
  },
  mutations: {
    addAlert (state, alert) {
      Vue.set(state.alerts, randomId(), alert)
    },
    dismissAlert (state, alertId) {
      Vue.delete(state.alerts, alertId)
    }
  }
}
