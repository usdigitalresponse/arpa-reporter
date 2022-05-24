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
    classes: Object
  },
  mounted () {
    window.addEventListener('focus', this.clearLoadingState)
  },
  destroyed () {
    window.addEventListener('focus', this.clearLoadingState)
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

        // override parent disabled class if in loading state
        // disabled: this?.classes?.disabled || this.isLoading
        disabled: this.isLoading
      }
    }
  },
  methods: {
    clearLoadingState () {
      this.isLoading = false
    },
    setLoadingState () {
      console.log('setLoadingState()')
      this.isLoading = true
    }
  }
}
</script>
