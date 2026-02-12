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
    graph: {
      tenantId: process.env.GRAPH_TENANT_ID || '',
      clientId: process.env.GRAPH_CLIENT_ID || '',
      clientSecret: process.env.GRAPH_CLIENT_SECRET || ''
    },
    sharepoint: {
      hostname: process.env.SP_HOSTNAME || '',
      siteId: process.env.SP_SITE_ID || '',
      sitePath: process.env.SP_SITE_PATH || '',
      listId: process.env.SP_LIST_ID || '',
      cacheTtlMs: Number(process.env.SP_CACHE_TTL_MS || '600000')
    },
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