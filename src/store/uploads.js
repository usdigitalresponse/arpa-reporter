
import { getJson } from './ajax'

export default {
  namespaced: true,
  state: {
    recentUploadId: null,
    allUploads: []
  },
  mutations: {
    setRecentUploadId (state, uploadId) {
      state.recentUploadId = uploadId
    },
    updateAllUploads (state, updatedUploads) {
      state.allUploads = updatedUploads
    }
  },
  actions: {
    async updateUploads ({ commit, rootState }) {
      const params = new URLSearchParams({ period_id: rootState.reportingPeriods.viewPeriodID })
      const result = await getJson('/api/uploads?' + params.toString())

      if (result.error) {
        commit('alerts/addAlert', { text: `updateUploads Error: ${result.error} (${result.text})`, level: 'err' }, { root: true })
      } else {
        commit('updateAllUploads', result.uploads)
      }
    }
  }
}
