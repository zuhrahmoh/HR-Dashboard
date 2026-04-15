import { prisma } from './db'

const CREATE_DISCIPLINARY_INCLUDE_TABLE = `CREATE TABLE IF NOT EXISTS "DisciplinaryCaseInclude" (
  "odooCaseKey" TEXT NOT NULL,
  "includeInReport" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DisciplinaryCaseInclude_pkey" PRIMARY KEY ("odooCaseKey")
)`

let ensureTablePromise: Promise<void> | null = null

async function ensureDisciplinaryIncludeTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = prisma
      .$executeRawUnsafe(CREATE_DISCIPLINARY_INCLUDE_TABLE)
      .then(() => undefined)
      .catch((err) => {
        ensureTablePromise = null
        throw err
      })
  }
  await ensureTablePromise
}

export async function getDisciplinaryIncludeMap(caseKeys: string[]): Promise<Map<string, boolean>> {
  if (!caseKeys.length) return new Map()
  await ensureDisciplinaryIncludeTable()
  const rows = await prisma.disciplinaryCaseInclude.findMany({
    where: { odooCaseKey: { in: caseKeys } },
    select: { odooCaseKey: true, includeInReport: true }
  })
  return new Map(rows.map((r) => [r.odooCaseKey, r.includeInReport]))
}

export async function setDisciplinaryIncludeFlag(odooCaseKey: string, includeInReport: boolean): Promise<void> {
  await ensureDisciplinaryIncludeTable()
  await prisma.disciplinaryCaseInclude.upsert({
    where: { odooCaseKey },
    create: { odooCaseKey, includeInReport },
    update: { includeInReport }
  })
}
