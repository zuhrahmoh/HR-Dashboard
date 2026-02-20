import { createError } from 'h3'
import { getOdooClient } from './odoo'

export type OdooAttachmentListItem = {
  id: number
  name: string
  mimetype: string | null
  fileSize: number | null
  createdAt: string | null
  updatedAt: string | null
}

function parseOdooEmployeeId(employeeKey: string): number {
  if (!employeeKey?.startsWith('odoo-')) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }
  const id = Number(employeeKey.slice('odoo-'.length))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid employeeKey' })
  }
  return id
}

function toNullableNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function toNullableString(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s ? s : null
}

export async function listEmployeeAttachments(employeeKey: string): Promise<OdooAttachmentListItem[]> {
  const employeeId = parseOdooEmployeeId(employeeKey)
  const client = await getOdooClient()

  const rows = await client.executeKw<any[]>(
    'ir.attachment',
    'search_read',
    [[['res_model', '=', 'hr.employee'], ['res_id', '=', employeeId]]],
    { fields: ['id', 'name', 'mimetype', 'file_size', 'create_date', 'write_date'], order: 'create_date desc', limit: 200 }
  )

  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for employee attachments.' })
  }

  return rows
    .map((r) => {
      const id = toNullableNumber(r?.id)
      if (!id) return null
      return {
        id,
        name: String(r?.name ?? '').trim() || 'Untitled',
        mimetype: toNullableString(r?.mimetype),
        fileSize: toNullableNumber(r?.file_size),
        createdAt: toNullableString(r?.create_date),
        updatedAt: toNullableString(r?.write_date)
      } satisfies OdooAttachmentListItem
    })
    .filter((v): v is OdooAttachmentListItem => Boolean(v))
}

export async function createEmployeeAttachment(input: {
  employeeKey: string
  filename: string
  mimeType?: string | null
  data: Buffer
}): Promise<{ id: number }> {
  const employeeId = parseOdooEmployeeId(input.employeeKey)
  const client = await getOdooClient()

  const sizeLimitBytes = 25 * 1024 * 1024
  if (input.data.length > sizeLimitBytes) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 25MB).' })
  }

  const name = input.filename.trim() || 'document'
  const datas = input.data.toString('base64')

  const id = await client.executeKw<number>(
    'ir.attachment',
    'create',
    [
      {
        name,
        type: 'binary',
        datas,
        mimetype: (input.mimeType ?? '').trim() || undefined,
        res_model: 'hr.employee',
        res_id: employeeId
      }
    ],
    { context: { active_test: false } }
  )

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for attachment create.' })
  }

  return { id }
}

export async function getEmployeeAttachmentContent(input: {
  employeeKey: string
  attachmentId: number
}): Promise<{ filename: string; mimeType: string | null; data: Buffer }> {
  const employeeId = parseOdooEmployeeId(input.employeeKey)
  const client = await getOdooClient()

  const metaRows = await client.executeKw<any[]>(
    'ir.attachment',
    'search_read',
    [[['id', '=', input.attachmentId], ['res_model', '=', 'hr.employee'], ['res_id', '=', employeeId]]],
    { fields: ['id', 'name', 'mimetype', 'type', 'url', 'file_size'], limit: 1, context: { active_test: false } }
  )

  const meta = metaRows?.[0]
  if (!meta) throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })

  const type = typeof meta?.type === 'string' ? meta.type.trim() : ''
  if (type && type !== 'binary') {
    throw createError({
      statusCode: 409,
      statusMessage: 'This attachment is not stored as a downloadable file in Odoo.'
    })
  }

  // Use read() + bin_size=false to ensure binary content is returned (not a size placeholder).
  const rows = await client.executeKw<any[]>(
    'ir.attachment',
    'read',
    [[input.attachmentId], ['id', 'name', 'mimetype', 'datas']],
    { context: { active_test: false, bin_size: false } }
  )

  const row = rows?.[0]
  const base64 = typeof row?.datas === 'string' ? row.datas.trim() : ''
  if (!base64) {
    const size = toNullableNumber(meta?.file_size)
    throw createError({
      statusCode: 404,
      statusMessage: size ? 'Attachment content missing in Odoo storage.' : 'Attachment not found'
    })
  }

  const data = Buffer.from(base64, 'base64')
  if (!data.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Attachment content missing in Odoo storage.'
    })
  }

  return {
    filename: String(row?.name ?? meta?.name ?? '').trim() || `attachment-${input.attachmentId}`,
    mimeType: toNullableString(row?.mimetype ?? meta?.mimetype),
    data
  }
}

export async function deleteEmployeeAttachment(input: { employeeKey: string; attachmentId: number }): Promise<{ deleted: true }> {
  const employeeId = parseOdooEmployeeId(input.employeeKey)
  const client = await getOdooClient()

  const ids = await client.executeKw<number[]>(
    'ir.attachment',
    'search',
    [[['id', '=', input.attachmentId], ['res_model', '=', 'hr.employee'], ['res_id', '=', employeeId]]],
    { limit: 1, context: { active_test: false } }
  )

  if (!Array.isArray(ids) || !ids.length) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  const ok = await client.executeKw<boolean>(
    'ir.attachment',
    'unlink',
    [[input.attachmentId]],
    { context: { active_test: false } }
  )

  if (!ok) {
    throw createError({ statusCode: 502, statusMessage: 'Could not delete attachment.' })
  }

  return { deleted: true }
}

