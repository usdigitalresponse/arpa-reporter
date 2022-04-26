<template>
  <div class="upload">
    <h1>Upload # {{ uploadId }}</h1>

    <AlertBox v-if="alert" :text="alert.text" :level="alert.level" :onClose="clearAlert" />

    <div v-if="errors.length > 0">
      <h4>Validation Errors</h4>
      <table class="table table-sm table-bordered table-striped">
        <thead>
          <tr>
            <th>#</th>
            <th>Error</th>
            <th>Tab</th>
            <th>Row</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="n" v-for="(error, n) in errors">
            <td>{{ n }}</td>
            <td>{{ error.message }}</td>
            <td>{{ titleize(error.tab) }}</td>
            <td>{{ error.row }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="upload">
      <ul class="list-group col-md-6">
        <li class="list-group-item">
          <span class="font-weight-bold">Reporting Period: </span>
          {{ upload.reporting_period_id }}
        </li>

        <li class="list-group-item" :class="{ 'list-group-item-warning': !upload.agency_id }">
          <span class="font-weight-bold">Agency: </span>
          {{ upload.agency_code || 'Not set' }}
        </li>

        <li class="list-group-item">
          <span class="font-weight-bold">Created: </span>
          {{ upload.created_at }} ({{ fromNow(upload) }}) by {{ upload.created_by }}
        </li>

        <li class="list-group-item">
          <button class="btn btn-primary" @click="validateUpload" :disabled="validating">
            Validate
          </button>
        </li>

      </ul>

      <table class="mt-3 table table-striped">
        <tbody>
          <tr :key="row.id" v-for="row in rows">
            <td>{{ row.id }}</td>
            <td>{{ preview(row) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      Loading...
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { titleize } from '../helpers/form-helpers'
import AlertBox from '../components/AlertBox'
export default {
  name: 'Upload',
  components: {
    AlertBox
  },
  data: function () {
    return {
      uploadId: this.$route.params.id,
      upload: null,
      documents: [],
      errors: [],
      alert: null,
      validating: false,
      rows: []
    }
  },
  computed: {
    isRecentlyUploaded: function () {
      return this.uploadId === this.$store.state.recentUploadId
    }
  },
  methods: {
    titleize,
    clearAlert: function () {
      this.alert = null
    },
    fromNow: function (upload) {
      return moment(upload.created_at).fromNow()
    },
    preview: function (o) {
      const s = JSON.stringify(o, null, '  ')
      const maxLength = 120
      if (s.length < maxLength) {
        return s
      }
      return `${s.slice(0, maxLength)}...`
    },
    validateUpload: async function () {
      this.validating = true

      const resp = await fetch(`/api/uploads/${this.uploadId}/validate`)
      const result = (await resp.json()) || { error: (await resp.body) }

      if (resp.ok) {
        this.errors = result.errors
        if (!this.errors.length) {
          this.loadUpload()
          this.alert = {
            text: 'Upload successfully validated!',
            level: 'ok'
          }
        }
      } else {
        this.alert = {
          text: `validateUpload Error (${resp.status}): ${result.error}`,
          level: 'err'
        }
      }

      this.validating = false
    },
    loadUpload: async function () {
      this.upload = null
      this.errors = []

      try {
        const resp = await fetch(`/api/uploads/${this.uploadId}`)
        const result = (await resp.json()) || { error: (await resp.body) }

        if (resp.ok) {
          this.upload = result.upload
        } else {
          this.alert = {
            text: `loadUpload Error (${resp.status}): ${result.error}`,
            level: 'err'
          }
        }
      } catch (e) {
        this.alert = {
          text: `loadUpload Unknown Error: ${e.message}`,
          level: 'err'
        }
      }
    },
    loadDocuments: async function () {
      try {
        const resp = await fetch(`/api/uploads/${this.uploadId}/documents`)
        const result = (await resp.json()) || { error: (await resp.body) }

        if (resp.ok) {
          this.documents = result.documents
        } else {
          this.errors.push({ message: result.error })
        }
      } catch (e) {
        this.alert = { text: `loadDocuments Unknown Error: ${e.message}`, level: 'err' }
      }
    },
    initialValidation: async function () {
      if (!this.isRecentlyUploaded) return

      this.$store.commit('setRecentUploadId', null)
      this.validateUpload()
    }
  },
  mounted: async function () {
    await this.loadUpload()
    this.initialValidation()
    this.loadDocuments()
  }
}
</script>

<style scoped>
.upload {
  margin: 0 auto;
  width: 90%;
}
</style>
