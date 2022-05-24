<template>
  <div>
    <div class="row mt-5 mb-5" v-if="viewingOpenPeriod">
      <div class="col" v-if="isAdmin">
        <a :href="downloadUrl()" class="btn btn-primary btn-block">Download Treasury Report</a>
      </div>

      <div class="col" v-if="isAdmin && false">
        <a href="/api/audit_report" class="btn btn-info btn-block">Download Audit Report</a>
      </div>

      <div class="col">
        <button @click.prevent="startUpload" class="btn btn-primary btn-block">Submit Spreadsheet</button>
      </div>

      <div class="col">
        <DownloadTemplateBtn :block="true" />
      </div>
    </div>

    <div class="row border border-danger rounded m-3 mb-3 p-3" v-else>
      <div class="col">
        This reporting period is closed.
      </div>
    </div>

    <p>
      Welcome to the ARPA reporter.
      To get started, click the "Download Empty Template" button, above, to get a copy of an empty template for reporting.
    </p>

    <p>
      You will need to fill out one template for every EC code that your agency uses.
      Once you've filled out a template, please return here to submit it.
      To do that, click the "Submit Spreadsheet" button, above.
      You can only submit spreadsheets for the currently-open reporting period.
    </p>

    <p>
      To view a list of all submitted spreadsheets, please click on the "Uploads" tab.
    </p>
  </div>
</template>

<script>
import DownloadTemplateBtn from '../components/DownloadTemplateBtn'

export default {
  name: 'Home',
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
    }
  },
  methods: {
    downloadUrl () {
      const periodId = this.$store.getters.viewPeriod.id || 0
      return `/api/exports?period_id=${periodId}`
    },
    startUpload: function () {
      if (this.viewingOpenPeriod) {
        this.$router.push({ path: '/new_upload' })
      }
    }
  },
  components: {
    DownloadTemplateBtn
  }
}
</script>
