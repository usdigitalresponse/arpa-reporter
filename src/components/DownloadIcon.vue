<template>
  <a :href="`/api/uploads/${row.id}/download`">
    <img
      class="mr-4"
      src="/assets/img/cloud-download.svg"
      alt=""
      width="20"
      height="20"
    />
  </a>
</template>

<script>
export default {
  name: 'DownloadIcon',
  props: {
    row: Object
  }
}
</script>
