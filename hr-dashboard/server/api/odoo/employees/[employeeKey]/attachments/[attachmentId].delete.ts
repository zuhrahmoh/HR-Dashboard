import { createError, getRouterParam } from 'h3'
import { deleteEmployeeAttachment } from '../../../../../utils/odooAttachments'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })

  const attachmentIdRaw = getRouterParam(event, 'attachmentId')
  const attachmentId = Number(attachmentIdRaw)
  if (!Number.isFinite(attachmentId)) throw createError({ statusCode: 400, statusMessage: 'Invalid attachmentId' })

  return await deleteEmployeeAttachment({ employeeKey, attachmentId })
})

