<template>
  <a :href="`/api/uploads/${upload.id}/download`" class="btn-sm btn-primary ml-2">
      Download file
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
