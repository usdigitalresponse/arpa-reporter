<template>
  <div>
    <h2>Subrecipient {{ recipientId }}</h2>

    <div v-if="!recipient" class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <div class="form-group row">
        <div class="col-sm-2">
          Created:
        </div>
        <div class="col-sm-10">
          In
          <router-link :to="`/uploads/${recipient.upload_id}`">
            Upload {{ recipient.upload_id }}
          </router-link>
          on {{ humanDate(recipient.created_at) }}
          by {{ recipient.created_by }}
        </div>
      </div>

      <div class="form-group row">
        <div class="col-sm-2">
          Updated:
        </div>
        <div class="col-sm-10">
          <span v-if="!recipient.updated_at">Never manually updated</span>
          <span v-else>
            By {{ recipient.updated_by_email }} on {{ humanDate(recipient.updated_at) }}
          </span>
        </div>
      </div>

      <div class="form-group row" v-for="(rule, key) in rules" :key="key">
        <label :for="key" class="col-sm-2 col-form-label">{{ rule.humanColName }}</label>
        <div class="col-sm-10">
          <select v-if="rule.listVals.length > 0" :id="key" v-model="record[key]" :readonly="isReadOnly(key)">
            <option :value="null"></option>
            <option v-for="opt in rule.listVals" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <input v-else type="text" class="form-control" :id="key" v-model="record[key]" :readonly="isReadOnly(key)">
        </div>
      </div>

      <div class="form-group row">
        <div class="col-sm-2">
          <button class="btn btn-primary" v-on:click="updateRecipient" :disabled="saving">Save</button>
        </div>

        <div class="col-sm-2">
          <button class="btn btn-secondary" v-on:click="setRecord">Reset</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { getJson, post } from '../store'

export default {
  name: 'Subrecipient',
  data: function () {
    return {
      recipient: null,
      rules: [],
      record: {},
      saving: false
    }
  },
  computed: {
    recipientId: function () {
      return Number(this.$route.params.id)
    },
    createdAtStr: function () {
      return this.recipient && moment(this.recipient.created_at).local().format('MMM Do YYYY, h:mm:ss A')
    }
  },
  methods: {
    loadRecipient: async function () {
      this.recipient = null

      const result = await getJson(`/api/subrecipients/${this.recipientId}`)
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadRecipient Error (${result.status}): ${result.error}`,
          level: 'err'
        })
      } else {
        this.recipient = result.recipient
        this.rules = result.rules
        this.setRecord()
      }
    },
    updateRecipient: async function () {
      this.saving = true

      try {
        const record = JSON.stringify(Object.fromEntries(
          Object.entries(this.record).filter(([key, val]) => val !== null)
        ))

        const result = await post(`/api/subrecipients/${this.recipientId}`, { record })
        if (result.error) throw new Error(result.error)

        this.$store.commit('addAlert', {
          text: `Recipient ${this.recipientId} successfully updated`,
          level: 'ok'
        })
      } catch (err) {
        this.$store.commit('addAlert', {
          text: `Error updating recipient ${this.recipientId}: ${err.message}`,
          level: 'err'
        })
      }

      this.saving = false
      this.loadRecipient()
    },
    setRecord: function () {
      this.record = this.recipient ? JSON.parse(this.recipient.record) : {}
    },
    isReadOnly: function (key) {
      return key === 'Unique_Entity_Identifier__c' || key === 'EIN__c'
    },
    humanDate: function (date) {
      return date && moment(date).local().format('MMM Do YYYY, h:mm:ss A')
    }
  },
  mounted: async function () {
    this.loadRecipient()
  },
  watch: {
    recipientId: function (to, from) {
      this.loadRecipient()
    }
  },
  components: {
  }
}
</script>
