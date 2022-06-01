
export default {
  state: {
    current_reporting_period_id: null,
    title: null
  },
  mutations: {
    setApplicationSettings (state, applicationSettings) {
      Object.assign(state, applicationSettings)
    }
  },
  actions: {
    reloadApplicationSettings ({ commit }) {
      return fetch('/api/application_settings')
        .then(r => r.json())
        .then(data => {
          commit('setApplicationSettings', data.application_settings)
        })
    },
    async loadApplicationSettings ({ commit, dispatch, getters }) {
      await dispatch('reloadApplicationSettings')
      commit('setViewPeriodID', getters.currentPeriodID)
    }
  },
  getters: {
    applicationTitle: state => {
      return state.title || 'ARPA Reporter'
    },
    currentPeriodID: state => {
      return Number(state.current_reporting_period_id)
    }
  }
}
