import { createError, getRouterParam, setHeader } from 'h3'
import { getEmployeeAttachmentContent } from '../../../../../utils/odooAttachments'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })

  const attachmentIdRaw = getRouterParam(event, 'attachmentId')
  const attachmentId = Number(attachmentIdRaw)
  if (!Number.isFinite(attachmentId)) throw createError({ statusCode: 400, statusMessage: 'Invalid attachmentId' })

  const file = await getEmployeeAttachmentContent({ employeeKey, attachmentId })

  setHeader(event, 'cache-control', 'private, max-age=60')
  setHeader(event, 'content-type', file.mimeType ?? 'application/octet-stream')
  setHeader(event, 'content-disposition', `attachment; filename="${file.filename.replace(/"/g, "'")}"`)
  return file.data
})

