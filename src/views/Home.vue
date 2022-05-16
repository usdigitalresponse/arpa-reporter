<template>
  <div>
    <div class="row mt-3 p-3 border border-success rounded" v-if="viewingOpenPeriod">
      <div class="col" v-if="isAdmin">
        <a :href="downloadUrl()" class="btn btn-primary">Download Treasury Report</a>
      </div>

      <div class="col" v-if="isAdmin && false">
        <a href="/api/audit_report" class="btn btn-info">Download Audit Report</a>
      </div>

      <div class="col">
        <button @click.prevent="startUpload" class="btn btn-primary">Upload Spreadsheet</button>
      </div>

      <div class="col">
        <a :href="downloadTemplateUrl" class="btn btn-success" download :disabled="!downloadTemplateUrl">
          Download Empty Template
        </a>
      </div>
    </div>

    <div class="row border border-danger rounded mt-3 p-3" v-else>
      <div class="col">
        This reporting period is closed.
      </div>
    </div>

    <div class="row mt-3">
      <div class="col-12">
        <h3>Upload History</h3>
      </div>
    </div>

    <div class="row">
      <UploadHistory />
    </div>
  </div>
</template>

<script>
import UploadHistory from '../components/UploadHistory'
export default {
  name: 'Home',
  components: {
    UploadHistory
  },
  computed: {
    isAdmin: function () {
      return this.role === 'admin'
    },
    role: function () {
      return this.$store.getters.user.role
    },
    viewingOpenPeriod () {
      return this.$store.getters.viewPeriodIsCurrent
    },
    isClosed: function () {
      return !(this.$store.getters.viewPeriodIsCurrent)
    },
    groups: function () {
      return this.$store.getters.documentGroups
    },
    downloadTemplateUrl () {
      const period = this.$store.getters.currentReportingPeriod
      return period ? `/api/reporting_periods/${period.id}/template` : null
    }
  },
  methods: {
    downloadUrl () {
      const periodId = this.$store.getters.viewPeriod.id || 0
      return `/api/exports?period_id=${periodId}`
    },
    startUpload: function () {
      if (this.viewingCurrentPeriod) {
        this.$router.push({ path: '/new_upload' })
      }
    }
  }

}
</script>
