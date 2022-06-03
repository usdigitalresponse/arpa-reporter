<template>
  <div>
    <h2>Agencies</h2>

    <div class="mb-4">
      <router-link to="/new_agency" class="btn btn-primary">
        Create New Agency
      </router-link>
    </div>

    <div>
      <table v-if="agencies" class="table table-striped">
        <thead>
          <tr>
            <th>Agency Code</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="agency in agencies" :key="agency.code">
            <td>{{ agency.code }}</td>
            <td>{{ agency.name }}</td>
            <td>
              <router-link :to="`/agencies/${agency.id}`" class="btn btn-primary">
                Edit
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Agencies',
  computed: {
    agencies: function () {
      return this.$store.state.agencies.agencies
    }
  },
  mounted: async function () {
    this.$store.dispatch('agencies/updateAgencies')
  }
}
</script>
