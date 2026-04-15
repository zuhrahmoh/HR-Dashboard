import { createError } from 'h3'

type JsonRpcError = { code: number; message: string; data?: unknown }
type JsonRpcResponse<T> = { jsonrpc: '2.0'; id: number | string; result?: T; error?: JsonRpcError }

type OdooRuntimeConfig = {
  url: string
  username: string
  password: string
  db?: string
  insecureTLS?: boolean
}

function splitOdooUrl(input: string): { baseUrl: string; dbFromUrl: string | null } {
  const trimmed = input.trim()
  if (!trimmed) return { baseUrl: '', dbFromUrl: null }
  try {
    const u = new URL(trimmed)
    const db = u.searchParams.get('db')
    return { baseUrl: u.origin, dbFromUrl: db && db.trim() ? db.trim() : null }
  } catch {
    return { baseUrl: trimmed.replace(/\/+$/, ''), dbFromUrl: null }
  }
}

async function jsonRpc<T>(baseUrl: string, params: Record<string, unknown>): Promise<T> {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: Date.now()
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/jsonrpc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: `Odoo JSON-RPC failed (${response.status})`
    })
  }

  const data = (await response.json()) as JsonRpcResponse<T>
  if (data.error) {
    throw createError({
      statusCode: 502,
      statusMessage: `Odoo JSON-RPC error: ${data.error.message}`
    })
  }

  return data.result as T
}

async function listDbs(baseUrl: string) {
  return await jsonRpc<string[]>(baseUrl, { service: 'db', method: 'list', args: [] })
}

async function authenticate(baseUrl: string, args: [string, string, string, Record<string, unknown>]) {
  return await jsonRpc<number | false>(baseUrl, { service: 'common', method: 'authenticate', args })
}

export function getOdooConfig(): OdooRuntimeConfig {
  const runtimeConfig = useRuntimeConfig()
  const odoo = (runtimeConfig as any).odoo as Partial<OdooRuntimeConfig> | undefined
  return {
    url: String(odoo?.url ?? '').trim(),
    username: String(odoo?.username ?? '').trim(),
    password: String(odoo?.password ?? ''),
    db: String(odoo?.db ?? '').trim() || undefined,
    insecureTLS: Boolean(odoo?.insecureTLS)
  }
}

export async function getOdooClient() {
  const config = getOdooConfig()
  if (!config.url || !config.username || !config.password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Odoo connection is not configured (set ODOO_URL, ODOO_USERNAME, ODOO_PASSWORD).'
    })
  }

  const { baseUrl, dbFromUrl } = splitOdooUrl(config.url)
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Odoo connection is not configured (set ODOO_URL, ODOO_USERNAME, ODOO_PASSWORD).'
    })
  }

  if (config.insecureTLS && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  let db = (config.db ?? '').trim() || (dbFromUrl ?? '')
  let uid: number | false = false

  if (db) {
    uid = await authenticate(baseUrl, [db, config.username, config.password, {}])
  } else {
    const dbs = await listDbs(baseUrl).catch(() => [])
    for (const candidateDb of dbs) {
      const candidateUid = await authenticate(baseUrl, [candidateDb, config.username, config.password, {}]).catch(() => false)
      if (candidateUid) {
        db = candidateDb
        uid = candidateUid
        break
      }
    }
  }

  if (!uid) {
    throw createError({
      statusCode: 401,
      statusMessage: db
        ? 'Odoo authentication failed.'
        : 'Odoo authentication failed (if your server has multiple databases, set ODOO_DB).'
    })
  }

  async function executeKw<T>(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {}
  ): Promise<T> {
    return await jsonRpc<T>(
      baseUrl,
      { service: 'object', method: 'execute_kw', args: [db, uid, config.password, model, method, args, kwargs] }
    )
  }

  async function fieldsGet(model: string) {
    return await executeKw<Record<string, { type?: string; string?: string }>>(model, 'fields_get', [], {
      attributes: ['type', 'string']
    })
  }

  return { executeKw, fieldsGet }
}

