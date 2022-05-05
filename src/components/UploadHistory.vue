<template>
  <table v-if="uploads && uploads.length > 0" class="table table-striped table-small m-0">
    <thead>
      <tr>
        <th>ID #</th>
        <th v-if="!forAgency">Agency</th>
        <th>EC Code</th>
        <th>Filename</th>
        <th>Validated?</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="upload in limUploads" :key="upload.id">
        <td>
          <router-link :to="`/uploads/${upload.id}`">
            {{ upload.id }}
          </router-link>
        </td>

        <td v-if="!forAgency">{{ upload.agency_code || 'Not set' }}</td>
        <td>{{ upload.ec_code || 'Not set' }}</td>
        <td>{{ upload.filename }} <DownloadIcon :upload="upload" /></td>
        <td>{{ upload.validated_at }}</td>
      </tr>
    </tbody>
  </table>

  <span v-else-if="error" class="text-danger">
    {{ this.error }}
  </span>

  <span v-else>
    No
    <span v-if="onlyValidated">validated</span>
    uploads
    <span v-if="forAgency">for agency {{ forAgency }}</span>
    .
  </span>
</template>

<script>
import moment from 'moment'
import DownloadIcon from '../components/DownloadIcon'

export default {
  name: 'UploadHistory',
  components: {
    DownloadIcon
  },
  props: {
    forAgency: Number,
    onlyValidated: Boolean,
    onError: Function,
    limit: Number
  },
  data: function () {
    return {
      uploads: null,
      error: null
    }
  },
  computed: {
    limUploads: function () {
      return this.uploads?.slice(0, this.limit)
    },
    periodId: function () {
      return this.$store.state.viewPeriodID
    }
  },
  methods: {
    uploadUrl: function (upload) {
      return `/uploads/${upload.id}`
    },
    fromNow: function (t) {
      return moment(t).fromNow()
    },
    agencyName: function (id) {
      return this.$store.getters.agencyName(id)
    },
    loadUploads: async function () {
      this.uploads = null
      this.error = null

      const params = new URLSearchParams({ period_id: this.periodId })
      this.forAgency && params.set('for_agency', this.forAgency)
      this.only_validated && params.set('only_validated', this.onlyValidated)

      try {
        const resp = await fetch('/api/uploads?' + params.toString())
        const result = (await resp.json()) || { error: (await resp.body) }

        if (resp.ok) {
          this.uploads = result.uploads
        } else {
          this.error = `loadUploads API Error (${resp.status}): ${result.error}`
        }
      } catch (e) {
        this.error = `loadUploads Unknown Error: ${e.message}`
      }

      this.processError()
    },
    processError: async function () {
      if (!this.error) return
      if (this.onError) {
        this.onError(this.error)
        this.error = null
      }
    }
  },
  watch: {
    periodId: async function () {
      this.loadUploads()
    }
  },
  mounted: async function () {
    this.loadUploads()
  }
}
</script>
