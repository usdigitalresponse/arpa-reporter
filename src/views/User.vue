<template>
  <div class="user">
    <h1>User</h1>
    <div v-if="loading">
      Loading..
    </div>
    <div v-else>
      <RecordForm
        type="Users"
        :columns="fields"
        :record="editUser"
        :id="editUser.id"
        :isNew="isNew"
        :onSave="onSave"
        :onCancel="onCancel"
        :onDone="onDone"
        :errorMessage="errorMessage"
      />
    </div>
  </div>
</template>

<script>
import RecordForm from '../components/RecordForm'
import _ from 'lodash'
export default {
  name: 'User',
  components: {
    RecordForm
  },
  data () {
    let id = 0
    if (this.$route && this.$route.params && this.$route.params.id) {
      id = parseInt(this.$route.params.id)
    }
    return {
      id,
      isNew: !id,
      editUser: this.findUser(id),
      errorMessage: null
    }
  },
  computed: {
    loading: function () {
      return this.id !== 0 && !this.editUser
    },
    fields: function () {
      return [
        { name: 'email', required: true },
        { name: 'name' },
        { name: 'role', required: true, allowedValues: this.roles },
        { name: 'agency_id', allowedValues: this.agencies }
      ]
    },
    agencies: function () {
      return [{ value: 0, name: 'None' }].concat(
        _.map(this.$store.state.agencies.agencies, a => {
          return { value: a.id, name: a.name }
        })
      )
    },
    roles: function () {
      return _.map(this.$store.state.users.configuration.roles, r => {
        return { value: r.name, name: r.name }
      })
    },
    users: function () {
      return this.$store.state.users.configuration.users
    }
  },
  watch: {
    users: function () {
      this.editUser = this.findUser(this.id)
    }
  },
  methods: {
    findUser (id) {
      const user = _.find(this.users, { id }) || {}
      return { ...user }
    },
    getAgencies () {
      this.agencyIds = [
        { value: 'None', name: 'None' },
        ..._.map(this.$store.state.agencies.agencies, 'id')
      ]
    },
    onSave (user) {
      const updatedUser = {
        ...this.editUser,
        ...user
      }
      if (!updatedUser.agency_id) {
        delete updatedUser.agency_id
      }
      return this.$store
        .dispatch(this.isNew ? 'users/createUser' : 'users/updateUser', updatedUser)
        .then(() => this.onDone())
        .catch(e => (this.errorMessage = e.message))
    },
    onCancel () {
      return this.onDone()
    },
    onDone () {
      return this.$router.push('/users')
    }
  }
}
</script>

<style scoped>
.user {
  width: 90%;
  margin: 0 auto;
}
</style>
