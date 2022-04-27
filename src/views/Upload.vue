<template>
  <div class="container-fluid" style="width: 90%">
    <div class="row">
      <AlertBox v-if="alert" :text="alert.text" :level="alert.level" :onClose="clearAlert" />
    </div>

    <h4 v-if="errors.length > 0" class="row text-danger">Validation Errors</h4>

    <div v-if="errors.length > 0" class="row">
      <table class="table table-sm table-bordered table-striped col-sm-12 col-md-6">
        <thead>
          <tr>
            <th>#</th>
            <th>Error</th>
            <th>Tab</th>
            <th>Row</th>
            <th>Col</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="n" v-for="(error, n) in errors">
            <td>{{ n }}</td>
            <td>{{ error.message }}</td>
            <td>{{ titleize(error.tab) }}</td>
            <td>{{ error.row }}</td>
            <td>{{ error.col }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h4 class="row">Upload # {{ uploadId }} details:</h4>

    <div v-if="upload" class="row">
      <div class="col-sm-12 col-md-6 mb-sm-3 mb-md-1">
        <ul class="list-group">
          <li class="list-group-item">
            <span class="font-weight-bold">Filename: </span>
            {{ upload.filename }}
          </li>

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
            {{ displayTs(upload.created_at) }} ({{ fromNow(upload.created_at) }}) by {{ upload.created_by }}
          </li>

          <li class="list-group-item" :class="validatedLiClass">
            <span class="font-weight-bold">Validation: </span>

            <span v-if="upload.validated_at">
              {{ displayTs(upload.validated_at) }} ({{ fromNow(upload.validated_at) }}) by {{ upload.validated_by_email }}
            </span>
            <span v-else>
              Not Validated
            </span>

            <button class="btn btn-primary ml-2" @click="validateUpload" :disabled="validating">
              <span v-if="upload.validated_at">Re-validate</span>
              <span v-else>Validate</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="col-sm-12 col-md-6" v-if="upload.agency_id">
        <h4>All from agency {{ upload.agency_code }} in period {{ upload.reporting_period_id }}</h4>

        <p>The green-highlighted upload will be included in Treasury reports.</p>

        <table class="table table-sm table-stripped">
          <thead>
            <tr>
              <th>#</th>
              <th>Uploaded</th>
              <th>Validated</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(sUpload, idx) in series" :key="sUpload.id" :class="{ 'table-success': idx === 0 }">
              <template v-if="sUpload.id === upload.id">
                <td>{{ upload.id }}</td>
                <td colspan="2">This upload</td>
              </template>

              <template v-else>
                <td><router-link :to="`/uploads/${sUpload.id}`">{{ sUpload.id }}</router-link></td>
                <td>{{ displayTs(sUpload.created_at) }}</td>
                <td v-if="sUpload.validated_at">{{ displayTs(sUpload.validated_at) }}</td>
                <td v-else>Not Validated</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="row">
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
      upload: null,
      documents: [],
      errors: [],
      series: [],
      alert: null,
      validating: false
    }
  },
  computed: {
    uploadId: function () {
      return Number(this.$route.params.id)
    },
    isRecentlyUploaded: function () {
      return this.uploadId === this.$store.state.recentUploadId
    },
    validatedLiClass: function () {
      if (!this.upload) return {}

      return {
        'list-group-item-success': this.upload.validated_at,
        'list-group-item-warning': !this.upload.validated_at
      }
    }
  },
  methods: {
    titleize,
    clearAlert: function () {
      this.alert = null
    },
    displayTs: function (ts) {
      return moment(ts).format('LTS ll')
    },
    fromNow: function (ts) {
      return moment(ts).fromNow()
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
        this.loadUpload()
        this.alert = {
          text: 'Upload successfully validated!',
          level: 'ok'
        }
      } else {
        this.errors = result.errors

        // we got an error from the backend, but the backend didn't send reasons
        if (!this.errors.length) {
          this.alert = {
            text: `validateUpload Error (${resp.status}): ${result.error}`,
            level: 'err'
          }
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

      // each time we refresh the upload, also refresh the series
      this.loadSeries()
    },
    loadSeries: async function () {
      try {
        const resp = await fetch(`/api/uploads/${this.uploadId}/series`)
        const result = (await resp.json()) || { error: (await resp.body) }

        if (resp.ok) {
          this.series = result.series
        } else {
          this.alert = {
            text: `loadUpload API Error (${resp.status}): ${result.error}`,
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
    },
    onLoad: async function () {
      await this.loadUpload()
      this.initialValidation()
      this.loadDocuments()
    }
  },
  watch: {
    uploadId: function (to, from) {
      this.onLoad()
    }
  },
  mounted: async function () {
    this.onLoad()
  }
}
</script>
