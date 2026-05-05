import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

function resolveJsonPath(fileName: string) {
  const candidates = [
    // Preferred: within the Nuxt app folder.
    fileURLToPath(new URL(`../../data/${fileName}`, import.meta.url)),
    // Fallback: repo root (older phases keep data files here).
    fileURLToPath(new URL(`../../../${fileName}`, import.meta.url))
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }

  return candidates[0]!
}

async function ensureFileInitialized(absolutePath: string) {
  if (existsSync(absolutePath)) return
  const dir = absolutePath.replace(/[\\/][^\\/]+$/, '')
  await mkdir(dir, { recursive: true })
  await writeFile(absolutePath, '[]\n', 'utf8')
}

function isRetriableFsError(err: unknown) {
  const e = err as { code?: unknown } | null
  const code = typeof e?.code === 'string' ? e.code : ''
  return code === 'EPERM' || code === 'EBUSY' || code === 'EACCES'
}

async function atomicWriteFile(destPath: string, content: string) {
  const dir = destPath.replace(/[\\/][^\\/]+$/, '')
  await mkdir(dir, { recursive: true })

  const tmpPath = `${destPath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmpPath, content, 'utf8')

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await rename(tmpPath, destPath)
      return
    } catch (err) {
      // On Windows, rename-overwrite can fail. Best-effort: delete destination and retry.
      if (existsSync(destPath)) {
        try {
          await unlink(destPath)
        } catch (unlinkErr) {
          if (!isRetriableFsError(unlinkErr)) throw err
        }
      }

      if (!isRetriableFsError(err) || attempt === 5) throw err
      await new Promise((r) => setTimeout(r, 25 * (attempt + 1)))
    }
  }
}

export async function readJsonArray<T>(fileName: string): Promise<T[]> {
  const path = resolveJsonPath(fileName)
  await ensureFileInitialized(path)
  const raw = await readFile(path, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  return Array.isArray(parsed) ? (parsed as T[]) : []
}

export async function writeJsonArray<T>(fileName: string, items: T[]): Promise<void> {
  const path = resolveJsonPath(fileName)
  await ensureFileInitialized(path)
  const payload = `${JSON.stringify(items, null, 2)}\n`
  await atomicWriteFile(path, payload)
}

