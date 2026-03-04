import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'
import { readJsonArray } from '../server/utils/jsonStore'

function requiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

function asDateOrNow(value: unknown) {
  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

const CHANGE_TYPES = ['Salary', 'Role', 'Reporting', 'Job Title', 'Contract Extension', 'Non-Renewal'] as const

function normalizeChangeTypes(value: unknown) {
  if (!Array.isArray(value)) return []
  const raw = value
    .flatMap((v) => {
      const s = typeof v === 'string' ? v.trim() : ''
      if (!s) return []
      if (s === 'Role, Reporting') return ['Role', 'Reporting']
      return [s]
    })
    .filter(Boolean)

  const allowed = new Set<string>(CHANGE_TYPES)
  const cleaned = raw.filter((t) => allowed.has(t))
  const set = new Set(cleaned)
  return CHANGE_TYPES.filter((t) => set.has(t))
}

async function main() {
  const databaseUrl = requiredEnv('DATABASE_URL')
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  const prisma = new PrismaClient({ adapter })

  try {
    const vacancies = await readJsonArray<any>('vacancies.json')
    for (const v of vacancies) {
      if (!v?.id) continue
      await prisma.vacancy.upsert({
        where: { id: String(v.id) },
        create: {
          id: String(v.id),
          positionTitle: String(v.positionTitle ?? ''),
          department: String(v.department ?? ''),
          country: String(v.country ?? ''),
          priority: String(v.priority ?? ''),
          createdAt: asDateOrNow(v.createdAt)
        },
        update: {
          positionTitle: String(v.positionTitle ?? ''),
          department: String(v.department ?? ''),
          country: String(v.country ?? ''),
          priority: String(v.priority ?? '')
        }
      })
    }

    const critical = await readJsonArray<any>('critical-recruitment.json')
    for (const c of critical) {
      if (!c?.id) continue
      await prisma.criticalRecruitment.upsert({
        where: { id: String(c.id) },
        create: {
          id: String(c.id),
          candidateName: String(c.candidateName ?? ''),
          position: String(c.position ?? ''),
          country: String(c.country ?? ''),
          stage: String(c.stage ?? ''),
          notes: typeof c.notes === 'string' && c.notes.trim() ? c.notes.trim() : null,
          createdAt: asDateOrNow(c.createdAt)
        },
        update: {
          candidateName: String(c.candidateName ?? ''),
          position: String(c.position ?? ''),
          country: String(c.country ?? ''),
          stage: String(c.stage ?? ''),
          notes: typeof c.notes === 'string' && c.notes.trim() ? c.notes.trim() : null
        }
      })
    }

    const disciplinary = await readJsonArray<any>('disciplinary-cases.json')
    for (const d of disciplinary) {
      if (!d?.id) continue
      await prisma.disciplinaryCase.upsert({
        where: { id: String(d.id) },
        create: {
          id: String(d.id),
          employeeName: String(d.employeeName ?? ''),
          department: String(d.department ?? ''),
          country: String(d.country ?? ''),
          summary: String(d.summary ?? ''),
          status: String(d.status ?? ''),
          createdAt: asDateOrNow(d.createdAt)
        },
        update: {
          employeeName: String(d.employeeName ?? ''),
          department: String(d.department ?? ''),
          country: String(d.country ?? ''),
          summary: String(d.summary ?? ''),
          status: String(d.status ?? '')
        }
      })
    }

    const contractChanges = await readJsonArray<any>('contract-changes.json')
    for (const r of contractChanges) {
      if (!r?.id) continue
      const changeTypes = normalizeChangeTypes(r.changeTypes)
      await prisma.contractChange.upsert({
        where: { id: String(r.id) },
        create: {
          id: String(r.id),
          employeeName: String(r.employeeName ?? ''),
          country: String(r.country ?? ''),
          department: String(r.department ?? ''),
          position: String(r.position ?? ''),
          changeTypes,
          status: typeof r.status === 'string' && r.status.trim() ? r.status.trim() : 'Approval required',
          description: String(r.description ?? ''),
          createdAt: asDateOrNow(r.createdAt)
        },
        update: {
          employeeName: String(r.employeeName ?? ''),
          country: String(r.country ?? ''),
          department: String(r.department ?? ''),
          position: String(r.position ?? ''),
          changeTypes,
          status: typeof r.status === 'string' && r.status.trim() ? r.status.trim() : 'Approval required',
          description: String(r.description ?? '')
        }
      })
    }

    const medical = await readJsonArray<any>('medical-enrollments.json')
    for (const m of medical) {
      if (!m?.id) continue
      await prisma.medicalEnrollment.upsert({
        where: { id: String(m.id) },
        create: {
          id: String(m.id),
          employeeName: String(m.employeeName ?? ''),
          country: String(m.country ?? ''),
          enrollmentType: typeof m.enrollmentType === 'string' && m.enrollmentType.trim() ? m.enrollmentType.trim() : null,
          vendor: typeof m.vendor === 'string' && m.vendor.trim() ? m.vendor.trim() : null,
          stage: String(m.stage ?? ''),
          dateInitiated: typeof m.dateInitiated === 'string' && m.dateInitiated.trim() ? m.dateInitiated.trim() : null,
          nextAction: typeof m.nextAction === 'string' && m.nextAction.trim() ? m.nextAction.trim() : null,
          hrRepresentative: typeof m.hrRepresentative === 'string' && m.hrRepresentative.trim() ? m.hrRepresentative.trim() : null,
          notes: typeof m.notes === 'string' && m.notes.trim() ? m.notes.trim() : null,
          attachmentsUrl: typeof m.attachmentsUrl === 'string' && m.attachmentsUrl.trim() ? m.attachmentsUrl.trim() : null,
          createdAt: asDateOrNow(m.createdAt),
          updatedAt: asDateOrNow(m.updatedAt ?? m.createdAt)
        },
        update: {
          employeeName: String(m.employeeName ?? ''),
          country: String(m.country ?? ''),
          enrollmentType: typeof m.enrollmentType === 'string' && m.enrollmentType.trim() ? m.enrollmentType.trim() : null,
          vendor: typeof m.vendor === 'string' && m.vendor.trim() ? m.vendor.trim() : null,
          stage: String(m.stage ?? ''),
          dateInitiated: typeof m.dateInitiated === 'string' && m.dateInitiated.trim() ? m.dateInitiated.trim() : null,
          nextAction: typeof m.nextAction === 'string' && m.nextAction.trim() ? m.nextAction.trim() : null,
          hrRepresentative: typeof m.hrRepresentative === 'string' && m.hrRepresentative.trim() ? m.hrRepresentative.trim() : null,
          notes: typeof m.notes === 'string' && m.notes.trim() ? m.notes.trim() : null,
          attachmentsUrl: typeof m.attachmentsUrl === 'string' && m.attachmentsUrl.trim() ? m.attachmentsUrl.trim() : null
        }
      })
    }

    const eap = await readJsonArray<any>('eap-referrals.json')
    for (const e of eap) {
      if (!e?.id) continue
      await prisma.eapReferral.upsert({
        where: { id: String(e.id) },
        create: {
          id: String(e.id),
          employeeName: String(e.employeeName ?? ''),
          country: String(e.country ?? ''),
          referralSource: typeof e.referralSource === 'string' && e.referralSource.trim() ? e.referralSource.trim() : null,
          referralDate: String(e.referralDate ?? ''),
          reasonCategory: String(e.reasonCategory ?? ''),
          reasonDetails: typeof e.reasonDetails === 'string' && e.reasonDetails.trim() ? e.reasonDetails.trim() : null,
          programStatus: String(e.programStatus ?? ''),
          startDate: typeof e.startDate === 'string' && e.startDate.trim() ? e.startDate.trim() : null,
          lastFollowUpDate: typeof e.lastFollowUpDate === 'string' && e.lastFollowUpDate.trim() ? e.lastFollowUpDate.trim() : null,
          nextFollowUpDate: typeof e.nextFollowUpDate === 'string' && e.nextFollowUpDate.trim() ? e.nextFollowUpDate.trim() : null,
          outcomeNotes: typeof e.outcomeNotes === 'string' && e.outcomeNotes.trim() ? e.outcomeNotes.trim() : null,
          ownerHr: typeof e.ownerHr === 'string' && e.ownerHr.trim() ? e.ownerHr.trim() : null,
          referralDocsUrl: typeof e.referralDocsUrl === 'string' && e.referralDocsUrl.trim() ? e.referralDocsUrl.trim() : null,
          closeDate: typeof e.closeDate === 'string' && e.closeDate.trim() ? e.closeDate.trim() : null,
          closedReason: typeof e.closedReason === 'string' && e.closedReason.trim() ? e.closedReason.trim() : null,
          createdAt: asDateOrNow(e.createdAt),
          updatedAt: asDateOrNow(e.updatedAt ?? e.createdAt)
        },
        update: {
          employeeName: String(e.employeeName ?? ''),
          country: String(e.country ?? ''),
          referralSource: typeof e.referralSource === 'string' && e.referralSource.trim() ? e.referralSource.trim() : null,
          referralDate: String(e.referralDate ?? ''),
          reasonCategory: String(e.reasonCategory ?? ''),
          reasonDetails: typeof e.reasonDetails === 'string' && e.reasonDetails.trim() ? e.reasonDetails.trim() : null,
          programStatus: String(e.programStatus ?? ''),
          startDate: typeof e.startDate === 'string' && e.startDate.trim() ? e.startDate.trim() : null,
          lastFollowUpDate: typeof e.lastFollowUpDate === 'string' && e.lastFollowUpDate.trim() ? e.lastFollowUpDate.trim() : null,
          nextFollowUpDate: typeof e.nextFollowUpDate === 'string' && e.nextFollowUpDate.trim() ? e.nextFollowUpDate.trim() : null,
          outcomeNotes: typeof e.outcomeNotes === 'string' && e.outcomeNotes.trim() ? e.outcomeNotes.trim() : null,
          ownerHr: typeof e.ownerHr === 'string' && e.ownerHr.trim() ? e.ownerHr.trim() : null,
          referralDocsUrl: typeof e.referralDocsUrl === 'string' && e.referralDocsUrl.trim() ? e.referralDocsUrl.trim() : null,
          closeDate: typeof e.closeDate === 'string' && e.closeDate.trim() ? e.closeDate.trim() : null,
          closedReason: typeof e.closedReason === 'string' && e.closedReason.trim() ? e.closedReason.trim() : null
        }
      })
    }

    const notes = await readJsonArray<any>('c-player-notes.json')
    for (const n of notes) {
      const employeeKey = typeof n?.employeeKey === 'string' ? n.employeeKey.trim() : ''
      if (!employeeKey) continue
      const note = typeof n?.note === 'string' ? n.note.trim() : ''
      if (!note) continue
      await prisma.cPlayerNote.upsert({
        where: { employeeKey },
        create: { employeeKey, note, updatedAt: asDateOrNow(n.updatedAt) },
        update: { note }
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

