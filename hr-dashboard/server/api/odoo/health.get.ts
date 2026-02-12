import { getOdooConfig } from '../../utils/odoo'

export default defineEventHandler(() => {
  const config = getOdooConfig()
  const hasUrl = Boolean(config.url?.trim())
  const hasUsername = Boolean(config.username?.trim())
  const hasPassword = Boolean(config.password)
  const configOk = hasUrl && hasUsername && hasPassword
  let connectionOk = false
  let error: string | null = null

  if (configOk) {
    try {
      const u = new URL(config.url.trim())
      return {
        config: 'ok',
        urlHost: u.hostname,
        urlPort: u.port || (u.protocol === 'https:' ? '443' : '80'),
        db: config.db || '(from URL)',
        insecureTLS: config.insecureTLS
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    }
  }

  return {
    config: configOk ? 'ok' : 'missing',
    hasUrl,
    hasUsername,
    hasPassword: !!config.password,
    error: error || (!configOk ? 'Set ODOO_URL, ODOO_USERNAME, ODOO_PASSWORD in .env and restart the server.' : null)
  }
})
