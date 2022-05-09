<template>
  <div class="container-fluid" style="width: 90%">
    <nav class="row navbar navbar-expand navbar-light bg-light">
      <a class="navbar-brand" href="#">
        {{ applicationTitle }}
        <span v-if="agencyName"> : {{ agencyName }}</span>
      </a>

      <span class="navbar-text">Reporting Period Ending:</span>

      <div class="collapse navbar-collapse" id="navbarNavDropdown">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item dropdown active">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="periodDropdown"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false">
              {{ viewPeriod.name }}
            </a>

            <div class="dropdown-menu" aria-labelledby="periodDropdown">
              <a
                class="dropdown-item"
                v-for="(name, key) in periodNames"
                :key="name"
                >
                <div @click="setViewPeriodID" :period-id=(key+1)>
                  {{ name }}
                </div>
              </a>
            </div>
          </li>
        </ul>

        <span class="navbar-text">{{ email }}</span>

        <ul class="navbar-nav">
          <li class="nav-item" v-if="loggedIn">
            <a href="#" @click="logout" class="nav-link">Logout</a>
          </li>
        </ul>
      </div>
    </nav>

    <ul class="row nav nav-tabs mb-2" v-if="loggedIn">
      <li class="nav-item">
        <router-link :class="navLinkClass('/')" to="/">Dashboard</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/agencies')" to="/agencies">Agencies</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/subrecipients')" to="/subrecipients">
          Sub Recipients
        </router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/users')" to="/users">Users</router-link>
      </li>

      <li class="nav-item" v-if="role === 'admin'">
        <router-link :class="navLinkClass('/reporting_periods')" to="/reporting_periods">
          Reporting Periods
        </router-link>
      </li>
    </ul>

    <div class="messages">
      <Messages />
    </div>

    <router-view />
  </div>
</template>

<script>
import Messages from './Messages'
import { titleize } from '../helpers/form-helpers'
import moment from 'moment'

export default {
  name: 'Logout',
  components: {
    Messages
  },
  computed: {
    user: function () {
      return this.$store.getters.user
    },
    email: function () {
      return this.user.email
    },
    agencyName: function () {
      return this.$store.getters.agencyName(this.user.agency_id)
    },
    role: function () {
      return this.$store.getters.user.role
    },
    loggedIn: function () {
      return this.$store.state.user !== null
    },
    periodNames: function () {
      return this.$store.getters.periodNames
    },
    viewPeriod: function () {
      return this.$store.getters.viewPeriod
    },
    applicationTitle: function () {
      return this.$store.getters.applicationTitle
    }
  },
  watch: {
  },

  methods: {
    titleize,
    logout (e) {
      e.preventDefault()
      this.$store
        .dispatch('logout')
        .then(() => this.$router.push({ path: '/login' }))
    },
    navLinkClass (to) {
      if (document.location.pathname === to) {
        return 'nav-link active'
      }
      return 'nav-link'
    },
    dateFormat: function (d) {
      return moment(d)
        .utc()
        .format('MM-DD-YYYY')
    },
    setViewPeriodID: function (e) {
      return this.$store
        .dispatch('viewPeriodID', e.target.attributes['period-id'].value || 0)
        .catch(e => (this.errorMessage = e.message))
    }
  }
}
</script>
