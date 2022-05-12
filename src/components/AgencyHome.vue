<template>
  <div>
    <div class="row buttons mt-5">
      <div class="col-6" v-show="viewingCurrentPeriod">
        <button class="btn btn-primary" @click.prevent="startUpload">
          Upload Spreadsheet
        </button>
      </div>
      <div class="col-6" v-show="viewingCurrentPeriod">
        <a :href="downloadTemplateUrl" class="btn btn-secondary" download :disabled="!downloadTemplateUrl">
          Download Empty Template
        </a>
      </div>

      <div class="closed" v-show="!viewingCurrentPeriod">
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
import moment from 'moment'
export default {
  name: 'Home',
  components: {
    UploadHistory
  },
  computed: {
    viewingCurrentPeriod () {
      return this.$store.getters.viewPeriodIsCurrent
    },
    currentReportingPeriod: function () {
      return this.$store.getters.currentReportingPeriod
    },
    downloadTemplateUrl () {
      const period = this.$store.getters.currentReportingPeriod
      return period ? `/api/reporting_periods/${period.id}/template` : null
    }
  },
  methods: {
    startUpload () {
      if (this.viewingCurrentPeriod) {
        this.$router.push({ path: '/new_upload' })
      }
    },
    dateFormat: function (d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY')
    }
  }
}
</script>

<style scoped>
.home {
  width: 90%;
  margin: 0 auto;
}
h2,
td,
pre {
  text-align: left;
}
.buttons {
  text-align: center;
}
.closed {
    padding: .5rem 0;
}
</style>
