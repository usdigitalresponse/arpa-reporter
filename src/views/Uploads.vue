<template>
  <div>
    <h2>Uploads</h2>

    <div class="row mb-4">
      <div class="col">
        <DownloadTemplateBtn />

        <router-link to="/new_upload" class="btn btn-primary ml-2">
          Submit Spreadsheet
        </router-link>
      </div>
    </div>

    <vue-good-table
      :columns="columns"
      :rows="rows"
      :group-options="groupOptions"
      styleClass="vgt-table table table-striped table-bordered"
      ref="uploadsTable"
      >

      <div slot="table-actions" class="form-check from-check-inline p-2">
        <input class="form-check-input" type="checkbox" id="groupByAgency" v-model="groupByAgency">
        <label class="form-check-label" for="groupByAgency">Group by agency?</label>

        <button class="btn btn-secondary btn-sm ml-2" @click="resetFilters">Reset Filters</button>
      </div>

      <div slot="emptystate">
        No uploads
      </div>

      <template slot="table-row" slot-scope="props">
        <span v-if="props.column.field === 'id'">
          <router-link :to="`/uploads/${props.row.id}`">
            {{ props.row.id }}
          </router-link>
        </span>

        <span v-else-if="props.column.field === 'filename'">
          {{ props.row.filename }}
          <DownloadIcon :upload="props.row" />
        </span>

        <span v-else>
          {{props.formattedRow[props.column.field]}}
        </span>
      </template>

    </vue-good-table>
  </div>
</template>

<script>
import moment from 'moment'
import 'vue-good-table/dist/vue-good-table.css'
import { VueGoodTable } from 'vue-good-table'

import DownloadIcon from '../components/DownloadIcon'
import DownloadTemplateBtn from '../components/DownloadTemplateBtn'

export default {
  name: 'Uploads',
  data: function () {
    return {
      groupByAgency: false
    }
  },
  computed: {
    uploads: function () {
      return this.$store.state.allUploads
    },
    agencies: function () {
      return this.$store.state.agencies
    },
    groupOptions: function () {
      return {
        enabled: this.groupByAgency
      }
    },
    rows: function () {
      if (!this.groupByAgency) return this.uploads

      const agencyObjects = {
        null: {
          mode: 'span',
          label: 'No agency set',
          children: []
        }
      }

      for (const agency of this.agencies) {
        agencyObjects[agency.code] = {
          mode: 'span',
          label: `${agency.code} (${agency.name})`,
          children: []
        }
      }

      for (const upload of this.uploads) {
        agencyObjects[upload.agency_code].children.push(upload)
      }

      return Object.values(agencyObjects)
    },
    columns: function () {
      return [
        {
          label: '#',
          field: 'id',
          type: 'number'
        },
        {
          label: 'Agency',
          field: 'agency_code',
          tdClass: (row) => { if (!row.agency_code) return 'table-danger' },
          filterOptions: {
            enabled: true,
            placeholder: 'Any agency',
            filterDropdownItems: this.agencies.map(agency => ({ value: agency.code, text: agency.code }))
          }
        },
        {
          label: 'EC Code',
          field: 'ec_code',
          tdClass: (row) => { if (!row.ec_code) return 'table-danger' },
          width: '120px',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter...'
          }
        },
        {
          label: 'Uploaded By',
          field: 'created_by',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by email...'
          }
        },
        {
          label: 'Filename',
          field: 'filename',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter by filename...'
          }
        },
        {
          label: 'Validated?',
          field: 'validated_at',
          formatFn: (date) => {
            if (!date) return 'Not set'
            return moment(date).local().format('MMM Do YYYY, h:mm:ss A')
          },
          tdClass: (row) => { if (!row.validated_at) return 'table-danger' },
          filterOptions: {
            enabled: true,
            placeholder: 'Any validation status',
            filterDropdownItems: [
              { value: true, text: 'Show only validated' }
            ],
            filterFn: (validatedAt, isIncluded) => validatedAt
          }
        }
      ]
    },
    periodId: function () {
      return this.$store.state.viewPeriodID
    }
  },
  methods: {
    resetFilters: function (evt) {
      this.$refs.uploadsTable.reset()
      this.$refs.uploadsTable.changeSort([])
    }
  },
  watch: {
    periodId: async function () {
      this.$store.dispatch('updateUploads')
    }
  },
  mounted: async function () {
    this.$store.dispatch('updateUploads')
    this.$store.dispatch('updateAgencies')
  },
  components: {
    VueGoodTable,
    DownloadIcon,
    DownloadTemplateBtn
  }
}
</script>
