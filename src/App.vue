<template>
  <div id="app">
    <Navigation />
  </div>
</template>

<script>
import '../scss/index.scss'
import 'bootstrap/dist/js/bootstrap.min.js'
import bsCustomFileInput from 'bs-custom-file-input'

import Navigation from './components/Navigation.vue'

window.addEventListener('load', function () {
  bsCustomFileInput.init()
})

export default {
  name: 'App',
  components: {
    Navigation
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
