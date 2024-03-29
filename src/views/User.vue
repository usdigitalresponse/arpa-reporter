<template>
  <div>
    <h2>User</h2>

    <div v-if="user === null" class="spinner-grow text-primary" role="status">
      <span class="sr-only">Loading...</span>
    </div>

    <div v-else>
      <div class="form-group row" v-if="!isNew">
        <div class="col-sm-2">
          Created:
        </div>
        <div class="col-sm-10">
          {{ user.created_at }}
        </div>
      </div>

      <StandardForm :initialRecord="user" :cols="cols" @save="onSave" @reset="onReset" :key="formKey" />
    </div>
  </div>
</template>

<script>
import StandardForm from '../components/StandardForm'
import { post } from '../store'

export default {
  name: 'User',
  data: function () {
    return {
      user: null,
      formKey: Date.now()
    }
  },
  computed: {
    userId: function () {
      return this.$route.params.id
    },
    isNew: function () {
      return this.userId === 'new'
    },
    cols: function () {
      return [
        { label: 'ID', field: 'id', readonly: true },
        { label: 'Email', field: 'email', required: true },
        { label: 'Name', field: 'name', required: true },
        { label: 'Role', field: 'role', selectItems: this.roleItems, required: true },
        { label: 'Agency', field: 'agency_id', selectItems: this.agencyItems }
      ]
    },
    roles: function () {
      return this.$store.getters.roles || []
    },
    roleItems: function () {
      return this.roles.map(r => ({ label: r.name, value: r.name }))
    },
    agencyItems: function () {
      return [{ value: null, name: '' }].concat(
        this.$store.state.agencies.map(a => ({ label: a.name, value: a.id }))
      )
    }
  },
  methods: {
    loadUser: async function () {
      if (this.isNew) {
        this.user = {}
        return
      }

      this.user = null
      await this.$store.dispatch('updateUsersRoles')

      const storeUser = this.$store.state.users.find(u => u.id === Number(this.userId))
      // StandardForm deals in ARPA Reporter's former user object representation where "role" is a simple string field, but the API and store now deal in the GOST format where role is an object.
      this.user = { ...storeUser, role: storeUser.role.name }
    },
    onSave: async function (user) {
      this.user = null

      try {
        // StandardForm deals in ARPA Reporter's former user object representation where "role" is a simple string field, but the API now deals in the GOST format where role is an object.
        const gostUser = { ...user, role: this.roles.find(r => r.name === user.role) }

        const result = await post('/api/users', { user: gostUser })
        if (result.error) throw new Error(result.error)

        const text = this.isNew
          ? `User ${result.user.id} successfully created`
          : `User ${result.user.email} successfully updated`

        this.$store.commit('addAlert', {
          text,
          level: 'ok'
        })

        if (this.isNew) {
          return this.$router.push(`/users/${result.user.id}`)
        } else {
          this.loadUser()
        }
      } catch (err) {
        this.user = user
        this.$store.commit('addAlert', {
          text: `Error updating user ${user.email}: ${err.message}`,
          level: 'err'
        })
      }
    },
    onReset () {
      this.formKey = Date.now()
    }
  },
  watch: {
    userId: function () {
      this.loadUser()
    }
  },
  mounted: async function () {
    this.loadUser()
  },
  components: {
    StandardForm
  }
}
</script>
