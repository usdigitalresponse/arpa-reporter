import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

async function main () {
  const session = await fetch('/api/sessions')
  const data = await session.json()

  if (data && data.user) {
    await store.dispatch('login', data.user)
  }

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

main()
