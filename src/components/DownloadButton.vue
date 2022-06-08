<template>
  <a
    download
    :href="href"
    class="btn btn-primary"
    :class="computedClasses"
    @click="setLoadingState"
  >
    <span
      v-if="isLoading"
      class="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
    ></span>
    <span v-if="isLoading"> Loading...</span>
    <span v-else> <slot /></span>
  </a>
</template>

<script>
export default {
  name: 'DownloadButton',
  props: {
    href: String,
    customClass: String,
    classes: Object,
    disabled: Boolean
  },
  mounted () {
    window.addEventListener('focus', this.clearLoadingState)
  },
  destroyed () {
    window.removeEventListener('focus', this.clearLoadingState)
  },
  data () {
    return {
      isLoading: false
    }
  },
  computed: {
    computedClasses () {
      return {
        ...this.classes,
        disabled: this.disabled || this.isLoading
      }
    }
  },
  methods: {
    clearLoadingState () {
      this.isLoading = false
    },
    setLoadingState () {
      this.isLoading = true
    }
  }
}
</script>
