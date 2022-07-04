<template>
  <a :href="`/api/uploads/${upload.id}/download`">
    <button class="btn btn-primary ml-2">
      <span>Download file</span>
    </button>
  </a>
</template>

<script>
export default {
  name: 'DownloadFileButton',
  props: {
    upload: Object
  }
}
</script>
