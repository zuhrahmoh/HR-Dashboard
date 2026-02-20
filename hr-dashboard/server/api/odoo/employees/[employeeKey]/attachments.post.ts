import { createError, getRouterParam, readMultipartFormData } from 'h3'
import { createEmployeeAttachment } from '../../../../utils/odooAttachments'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.type && p.data && p.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: 'file is required' })
  }

  const filename = (file.filename ?? '').trim() || 'document'

  const created = await createEmployeeAttachment({
    employeeKey,
    filename,
    mimeType: file.type ?? null,
    data: file.data
  })

  return created
})

