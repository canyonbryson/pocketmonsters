// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/styles/main.css'],
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  }
})
