<template>
  <div class="home">
    <div>
      <div class="row buttons mt-5">
        <div class="col-3">
          <a :href="downloadUrl()" class="btn btn-primary">Download Treasury Report</a>
        </div>
        <div class="closed" v-show="isClosed">
          This reporting period is closed.
        </div>
        <div class="col-3" v-show="viewingCurrentPeriod">
          <a href="/api/audit_report" class="btn btn-primary"
            >Download Audit Report</a
          >
        </div>
        <div class="col-3" v-show="viewingCurrentPeriod">
          <div @click.prevent="startUpload" class="btn btn-secondary">
            Upload Agency Spreadsheet
          </div>
        </div>
        <div class="col-3" v-show="viewingCurrentPeriod">
          <a :href="downloadTemplateUrl" class="btn btn-secondary" download :disabled="!downloadTemplateUrl">
            Download Empty Template
          </a>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12">
          <h3>Upload History</h3>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <UploadHistory />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UploadHistory from '../components/UploadHistory'
import { titleize } from '../helpers/form-helpers'
import moment from 'moment'
import _ from 'lodash'
export default {
  name: 'GrantsOfficeHome',
  components: {
    UploadHistory
  },
  computed: {
    viewingCurrentPeriod () {
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
  watch: {
  },
  methods: {
    titleize,
    downloadUrl () {
      const periodId = this.$store.getters.viewPeriod.id || 0
      return `/api/exports?period_id=${periodId}`
    },
    documentCount (tableName) {
      if (tableName === 'subrecipient') {
        return this.$store.state.subrecipients.length
      } else {
        const records = this.groups[tableName]
        return _.filter(records, r => r.type === tableName).length
      }
    },
    fromNow: function (t) {
      return moment(t).fromNow()
    },
    dateFormat: function (d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY')
    },
    startUpload: function () {
      if (this.viewingCurrentPeriod) {
        this.$router.push({ path: '/new_upload' })
      }
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
.count {
  text-align: center;
  font-size: 30px;
  font-weight: bold;
}
.buttons {
  text-align: center;
}
.closed {
    padding: .5rem 0;
}
</style>
