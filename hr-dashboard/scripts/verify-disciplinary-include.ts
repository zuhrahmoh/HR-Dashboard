import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const n = await prisma.disciplinaryCaseInclude.count()
  console.log(`DisciplinaryCaseInclude: table OK (row count: ${n})`)
} finally {
  await prisma.$disconnect()
  await pool.end()
}
