<template>
  <div class="data">
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
            <th>Recent Uploads</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="agency in agencies" :key="agency.code">
            <td>{{ agency.code }}</td>
            <td>{{ agency.name }}</td>
            <td>
              <UploadHistory :for-agency="agency.id" :only-validated="true" limit="3" />
            </td>
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
import UploadHistory from '../components/UploadHistory'

export default {
  name: 'Agencies',
  components: {
    UploadHistory
  },
  computed: {
    agencies: function () {
      return this.$store.state.agencies
    }
  }
}
</script>

<style scoped>
.data {
  width: 90%;
  margin: 0 auto;
}
table {
  width: 100%;
  margin: 50px auto;
}
h2,
td {
  text-align: left;
}
</style>
