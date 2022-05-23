<template>
  <a download :href="href" class="btn" :class="classes">
    Download Empty Template
  </a>
</template>

<script>
export default {
  name: 'DownloadTemplateBtn',
  computed: {
    periodId: function () {
      return this.$store.state.viewPeriodID
    },
    href: function () {
      return `/api/reporting_periods/${this.periodId}/template`
    },
    isDisabled: function () {
      return !this.$store.getters.viewPeriodIsCurrent
    },
    classes: function () {
      return {
        'btn-secondary': this.isDisabled,
        'btn-success': !this.isDisabled,
        disabled: this.isDisabled
      }
    }
  }
}
</script>
