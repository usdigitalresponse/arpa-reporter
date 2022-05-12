<template>
  <table v-if="uploads && uploads.length > 0" class="table table-striped table-small m-0">
    <thead>
      <tr>
        <th>ID #</th>
        <th v-if="!forAgency">Agency</th>
        <th>EC Code</th>
        <th>Uploaded By</th>
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
        <td>{{ upload.created_by }}</td>
        <td>{{ upload.filename }} <DownloadIcon :upload="upload" /></td>
        <td>{{ upload.validated_at }}</td>
      </tr>
    </tbody>
  </table>

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
    limit: Number
  },
  computed: {
    uploads: function () {
      let uploads = this.$store.state.allUploads
      if (uploads === null) return uploads

      if (this.onlyValidated) {
        uploads = uploads.filter(upload => upload.validated_at)
      }

      if (this.forAgency) {
        uploads = uploads.filter(upload => upload.agency_id === this.forAgency)
      }

      return uploads
    },
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
    }
  },
  watch: {
    periodId: async function () {
      this.$store.dispatch('updateUploads')
    }
  },
  mounted: async function () {
    this.$store.dispatch('updateUploads')
  }
}
</script>
