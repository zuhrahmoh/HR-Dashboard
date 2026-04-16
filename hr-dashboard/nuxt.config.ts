// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devServer: { host: 'localhost', port: 3000 },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  routeRules: {
    '/': { redirect: '/odoo' },
    '/performance': { redirect: '/contracts' }
  },
  vite: {
    server: {
      hmr: { port: 24679 }
    }
  },
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || '',
    auth: {
      tenantId: process.env.AUTH_TENANT_ID || '',
      clientId: process.env.AUTH_CLIENT_ID || '',
      clientSecret: process.env.AUTH_CLIENT_SECRET || '',
      redirectUri: process.env.AUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      requiredRole: process.env.AUTH_REQUIRED_ROLE || 'HR.User'
    },
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
    sharepointSalary: {
      siteId: process.env.NUXT_SHAREPOINT_SITE_ID || 'root',
      listId: process.env.NUXT_SHAREPOINT_SALARY_LIST_ID || '',
      cacheTtlMs: Number(process.env.NUXT_SHAREPOINT_SALARY_CACHE_TTL_MS || '600000')
    },
    odoo: {
      url: process.env.ODOO_URL || '',
      username: process.env.ODOO_USERNAME || '',
      password: process.env.ODOO_PASSWORD || '',
      db: process.env.ODOO_DB || '',
      insecureTLS: process.env.ODOO_INSECURE_TLS === '1',
      cacheTtlMs: Number(process.env.ODOO_CACHE_TTL_MS || '30000'),
      contractChangeLineModel: process.env.ODOO_CONTRACT_CHANGE_LINE_MODEL || '',
      contractChangeEmployeeField: process.env.ODOO_CONTRACT_CHANGE_EMPLOYEE_FIELD || 'employee_id',
      contractChangeTypeField: process.env.ODOO_CONTRACT_CHANGE_TYPE_FIELD || '',
      contractChangeStatusField: process.env.ODOO_CONTRACT_CHANGE_STATUS_FIELD || '',
      contractChangeDescriptionField: process.env.ODOO_CONTRACT_CHANGE_DESCRIPTION_FIELD || '',
      medicalEnrolmentLineModel: process.env.ODOO_MEDICAL_ENROLMENT_LINE_MODEL || 'hr.medical.enrolment',
      eapLineModel: process.env.ODOO_EAP_LINE_MODEL || 'hr.eap',
      disciplineCaseLineModel: process.env.ODOO_DISCIPLINE_CASE_LINE_MODEL || 'hr.discipline.case'
    }
  }
})