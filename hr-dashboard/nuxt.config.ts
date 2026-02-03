// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: { host: '127.0.0.1', port: 3000 },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss']
})