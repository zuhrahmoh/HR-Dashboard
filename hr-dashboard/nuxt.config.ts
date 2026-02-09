// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: { host: '127.0.0.1', port: 3000 },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  vite: {
    server: {
      hmr: { port: 24679 }
    }
  },
  runtimeConfig: {
    odoo: {
      url: process.env.ODOO_URL || '',
      username: process.env.ODOO_USERNAME || '',
      password: process.env.ODOO_PASSWORD || '',
      db: process.env.ODOO_DB || '',
      insecureTLS: process.env.ODOO_INSECURE_TLS === '1',
      cacheTtlMs: Number(process.env.ODOO_CACHE_TTL_MS || '30000')
    }
  }
})