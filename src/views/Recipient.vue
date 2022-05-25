<template>
  <div>
    <h2>Recipient {{ recipientId }}</h2>

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
          on {{ createdAtStr }}
          by {{ recipient.created_by }}
        </div>
      </div>

      <div class="form-group row" v-for="(rule, key) in rules" :key="key">
        <label :for="key" class="col-sm-2 col-form-label">{{ rule.humanColName }}</label>
        <div class="col-sm-10">
          <select v-if="rule.listVals.length > 0" :id="key" v-model="record[key]" :readonly="isReadOnly(key)">
            <option v-for="opt in rule.listVals" :key="opt">{{ opt }}</option>
          </select>

          <input v-else type="text" class="form-control" :id="key" v-model="record[key]" :readonly="isReadOnly(key)">
        </div>
      </div>

      <div class="form-group row">
        <div class="col-sm-2">
          <button class="btn btn-primary">Save</button>
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
import { getJson } from '../store'

export default {
  name: 'Recipient',
  data: function () {
    return {
      recipient: null,
      rules: [],
      record: {}
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

      const result = await getJson(`/api/recipients/${this.recipientId}`)
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
    setRecord: function () {
      this.record = this.recipient ? JSON.parse(this.recipient.record) : {}
    },
    isReadOnly: function (key) {
      return key === 'Unique_Entity_Identifier__c' || key === 'EIN__c'
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
