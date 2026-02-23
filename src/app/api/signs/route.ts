import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function scanDirectory(dir: string, urlPrefix: string) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.svg'))
    .map((filename) => {
      const id = filename.replace('.svg', '')
      const label = id
        .replace(/^(img|sign)-/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

      return { id, filename, url: `${urlPrefix}/${filename}`, label }
    })
}

export async function GET() {
  const scenesDir = path.join(process.cwd(), 'public', 'signs', 'scenes', 'svgs')
  const silhouettesDir = path.join(process.cwd(), 'public', 'signs', 'silhouettes', 'svgs')

  const scenes = scanDirectory(scenesDir, '/signs/scenes/svgs')
  const silhouettes = scanDirectory(silhouettesDir, '/signs/silhouettes/svgs')

  return NextResponse.json({ scenes, silhouettes })
}
