<template>
  <div class="upload">
    <AlertBox v-if="alert" :text="alert.text" :level="alert.level" :onClose="clearAlert" />

    <div v-if="errors.length > 0">
      <h4>Validation Errors</h4>
      <table class="table table-sm table-bordered table-striped col-md-6">
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

    <h4>Upload # {{ uploadId }} details:</h4>

    <div v-if="upload">
      <ul class="list-group col-md-6">
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
          {{ upload.created_at }} ({{ fromNow(upload.created_at) }}) by {{ upload.created_by }}
        </li>

        <li class="list-group-item" :class="validatedLiClass">
          <span class="font-weight-bold">Validation: </span>

          <span v-if="upload.validated_at">
            {{ upload.validated_at }} ({{ fromNow(upload.validated_at) }}) by {{ upload.validated_by_email }}
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
      uploadId: Number(this.$route.params.id),
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
