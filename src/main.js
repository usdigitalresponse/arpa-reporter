import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'
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

  Sentry.init({
    Vue,
    dsn: 'https://74d4e635758145d2928c6b85536a7479@o1325758.ingest.sentry.io/6591485',
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: ['localhost', 'my-site-url.com', /^\//]
      })
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  })

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
}

main()
