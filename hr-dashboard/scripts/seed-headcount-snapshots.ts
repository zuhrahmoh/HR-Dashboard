import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'

function requiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`${name} is not set`)
  return v
}

type SnapshotInput = { monthKey: string; headcount: number }

function monthKeyToUtcDate(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey.trim())
  if (!m) throw new Error(`Invalid monthKey: ${monthKey}`)
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) throw new Error(`Invalid monthKey: ${monthKey}`)
  return new Date(Date.UTC(y, mo - 1, 1))
}

const SNAPSHOTS: SnapshotInput[] = [
  // 2022 (Jan/Feb not provided in source table)
  { monthKey: '2022-03', headcount: 438 },
  { monthKey: '2022-04', headcount: 445 },
  { monthKey: '2022-05', headcount: 445 },
  { monthKey: '2022-06', headcount: 477 },
  { monthKey: '2022-07', headcount: 475 },
  { monthKey: '2022-08', headcount: 487 },
  { monthKey: '2022-09', headcount: 462 },
  { monthKey: '2022-10', headcount: 462 },
  { monthKey: '2022-11', headcount: 460 },
  { monthKey: '2022-12', headcount: 447 },

  // 2023
  { monthKey: '2023-01', headcount: 454 },
  { monthKey: '2023-02', headcount: 456 },
  { monthKey: '2023-03', headcount: 449 },
  { monthKey: '2023-04', headcount: 438 },
  { monthKey: '2023-05', headcount: 438 },
  { monthKey: '2023-06', headcount: 427 },
  { monthKey: '2023-07', headcount: 409 },
  { monthKey: '2023-08', headcount: 403 },
  { monthKey: '2023-09', headcount: 384 },
  { monthKey: '2023-10', headcount: 381 },
  { monthKey: '2023-11', headcount: 379 },
  { monthKey: '2023-12', headcount: 374 },

  // 2024
  { monthKey: '2024-01', headcount: 334 },
  { monthKey: '2024-02', headcount: 323 },
  { monthKey: '2024-03', headcount: 324 },
  { monthKey: '2024-04', headcount: 322 },
  { monthKey: '2024-05', headcount: 321 },
  { monthKey: '2024-06', headcount: 312 },
  { monthKey: '2024-07', headcount: 304 },
  { monthKey: '2024-08', headcount: 305 },
  { monthKey: '2024-09', headcount: 294 },
  { monthKey: '2024-10', headcount: 283 },
  { monthKey: '2024-11', headcount: 284 },
  { monthKey: '2024-12', headcount: 283 },

  // 2025
  { monthKey: '2025-01', headcount: 282 },
  { monthKey: '2025-02', headcount: 282 },
  { monthKey: '2025-03', headcount: 280 },
  { monthKey: '2025-04', headcount: 275 },
  { monthKey: '2025-05', headcount: 274 },
  { monthKey: '2025-06', headcount: 273 },
  { monthKey: '2025-07', headcount: 274 },
  { monthKey: '2025-08', headcount: 283 },
  { monthKey: '2025-09', headcount: 288 },
  { monthKey: '2025-10', headcount: 301 },
  { monthKey: '2025-11', headcount: 305 },
  { monthKey: '2025-12', headcount: 309 },

  // 2026 (partial)
  { monthKey: '2026-01', headcount: 299 },
  { monthKey: '2026-02', headcount: 302 },
  { monthKey: '2026-03', headcount: 298 }
]

async function main() {
  const databaseUrl = requiredEnv('DATABASE_URL')
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  const prisma = new PrismaClient({ adapter })

  try {
    for (const s of SNAPSHOTS) {
      const month = monthKeyToUtcDate(s.monthKey)
      await prisma.headcountSnapshot.upsert({
        where: { month },
        create: { month, headcount: s.headcount },
        update: { headcount: s.headcount }
      })
    }
    const count = await prisma.headcountSnapshot.count()
    // eslint-disable-next-line no-console
    console.log(`Seeded headcount snapshots. Total rows now: ${count}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

