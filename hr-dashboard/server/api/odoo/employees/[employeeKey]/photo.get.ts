import { createError, getRouterParam, setHeader } from 'h3'
import { getOdooClient } from '../../../../utils/odoo'

function pickFirstExistingField(fields: Record<string, unknown>, candidates: string[]) {
  for (const name of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) return name
  }
  return null
}

function detectImageContentType(buf: Buffer) {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 6 && buf.subarray(0, 6).toString('ascii') === 'GIF87a') return 'image/gif'
  if (buf.length >= 6 && buf.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return 'application/octet-stream'
}

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  if (!employeeKey.startsWith('odoo-')) throw createError({ statusCode: 404, statusMessage: 'Employee not found' })

  const id = Number(employeeKey.slice('odoo-'.length))
  if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid employeeKey' })

  const client = await getOdooClient()
  const fieldInfo = await client.fieldsGet('hr.employee')

  const imageField = pickFirstExistingField(fieldInfo as any, [
    'image_256',
    'image_512',
    'image_128',
    'avatar_128',
    'image_1024',
    'image_1920'
  ])
  if (!imageField) throw createError({ statusCode: 404, statusMessage: 'Employee photo not available' })

  const rows = await client.executeKw<any[]>(
    'hr.employee',
    'search_read',
    [[['id', '=', id]]],
    { fields: [imageField], limit: 1, context: { active_test: false } }
  )
  const base64 = rows?.[0]?.[imageField]
  if (typeof base64 !== 'string' || !base64.trim()) {
    throw createError({ statusCode: 404, statusMessage: 'Employee photo not found' })
  }

  const buf = Buffer.from(base64, 'base64')
  if (!buf.length) throw createError({ statusCode: 404, statusMessage: 'Employee photo not found' })

  setHeader(event, 'cache-control', 'private, max-age=300')
  setHeader(event, 'content-type', detectImageContentType(buf))
  return buf
})

