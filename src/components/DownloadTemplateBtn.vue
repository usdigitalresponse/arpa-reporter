<template>
  <a download :href="href" class="btn btn-secondary" :class="classes">
    Download Empty Template
  </a>
</template>

<script>
export default {
  name: 'DownloadTemplateBtn',
  props: {
    block: Boolean
  },
  computed: {
    periodId: function () {
      return this.$store.state.reportingPeriods.viewPeriodID
    },
    href: function () {
      return `/api/reporting_periods/${this.periodId}/template`
    },
    isDisabled: function () {
      return !this.$store.getters.viewPeriodIsCurrent
    },
    classes: function () {
      return {
        disabled: this.isDisabled,
        'btn-block': this.block
      }
    }
  }
}
</script>
