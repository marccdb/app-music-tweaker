import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

const FILE_MB = Number.parseInt(process.env.MEMORY_SMOKE_FILE_MB || '256', 10)
const ITERATIONS = Number.parseInt(process.env.MEMORY_SMOKE_ITERATIONS || '3', 10)
const MAX_PEAK_RSS_MB = Number.parseInt(process.env.MEMORY_SMOKE_MAX_PEAK_RSS_MB || '900', 10)
const MAX_POST_GC_RSS_MB = Number.parseInt(process.env.MEMORY_SMOKE_MAX_POST_GC_RSS_MB || '550', 10)

if (!Number.isFinite(FILE_MB) || FILE_MB <= 0) {
  throw new Error('Invalid MEMORY_SMOKE_FILE_MB.')
}

if (!Number.isFinite(ITERATIONS) || ITERATIONS <= 0) {
  throw new Error('Invalid MEMORY_SMOKE_ITERATIONS.')
}

const bytesPerMb = 1024 * 1024
const targetBytes = FILE_MB * bytesPerMb

function rssMb() {
  return process.memoryUsage().rss / bytesPerMb
}

async function maybeGc() {
  if (typeof global.gc === 'function') {
    global.gc()
  }
  await new Promise((resolve) => setTimeout(resolve, 40))
}

async function main() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'modaudio-memory-smoke-'))
  const tempFile = path.join(tempDir, `long-${FILE_MB}mb.wav`)
  let peakRss = rssMb()

  try {
    await fs.writeFile(tempFile, Buffer.alloc(44))
    const handle = await fs.open(tempFile, 'r+')
    try {
      await handle.truncate(targetBytes)
    } finally {
      await handle.close()
    }

    await maybeGc()
    const startRss = rssMb()

    for (let index = 1; index <= ITERATIONS; index += 1) {
      let payload = await fs.readFile(tempFile)
      peakRss = Math.max(peakRss, rssMb())

      if (payload.byteLength !== targetBytes) {
        throw new Error(`Unexpected read size on iteration ${index}: ${payload.byteLength}`)
      }

      payload = Buffer.alloc(0)
      await maybeGc()

      const currentRss = rssMb()
      peakRss = Math.max(peakRss, currentRss)
      console.log(`iteration=${index} rssMb=${currentRss.toFixed(1)}`)
    }

    await maybeGc()
    const endRss = rssMb()

    console.log(
      `memory-smoke fileMb=${FILE_MB} iterations=${ITERATIONS} startRssMb=${startRss.toFixed(1)} peakRssMb=${peakRss.toFixed(1)} endRssMb=${endRss.toFixed(1)}`,
    )

    if (peakRss > MAX_PEAK_RSS_MB) {
      throw new Error(`Peak RSS ${peakRss.toFixed(1)}MB exceeds limit ${MAX_PEAK_RSS_MB}MB`)
    }

    if (endRss > MAX_POST_GC_RSS_MB) {
      throw new Error(`Post-GC RSS ${endRss.toFixed(1)}MB exceeds limit ${MAX_POST_GC_RSS_MB}MB`)
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
