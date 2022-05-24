<template>
  <DownloadButton :href="href" :classes="classes">
    Download Empty Template
  </DownloadButton>
</template>

<script>
import DownloadButton from './DownloadButton.vue'

export default {
  name: 'DownloadTemplateBtn',
  props: {
    block: Boolean
  },
  components: {
    DownloadButton
  },
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
        'btn-block': this.block,
        'btn-secondary': true
        // disabled: this.isDisabled
      }
    }
  }
}
</script>
