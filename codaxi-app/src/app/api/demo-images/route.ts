import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'codaxi-app', 'public', 'demo')
    // Fallback if project root differs (production build often runs with cwd at app root)
    const altPublicDir = path.join(process.cwd(), 'public', 'demo')

    let dirToUse = publicDir
    try {
      await fs.access(publicDir)
    } catch {
      dirToUse = altPublicDir
    }

    const entries = await fs.readdir(dirToUse, { withFileTypes: true })
    const allowed = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => allowed.has(path.extname(name).toLowerCase()))
      // sort by modified time desc so newest first
    const stats = await Promise.all(files.map((name) => fs.stat(path.join(dirToUse, name)).then((s) => ({ name, mtimeMs: s.mtimeMs }))))
    stats.sort((a, b) => b.mtimeMs - a.mtimeMs)
    const urls = stats.map(({ name }) => encodeURI(`/demo/${name}`))
    return NextResponse.json({ images: urls })
  } catch (error) {
    return NextResponse.json({ images: [] }, { status: 200 })
  }
}


