#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PRODUCTS_FILE = path.join(__dirname, '..', 'shopify-products.json')
const ORIGINALS_DIR = path.join(__dirname, '..', 'public', 'signs', 'originals')
const SVG_DIR = path.join(__dirname, '..', 'public', 'signs', 'svgs')

fs.mkdirSync(ORIGINALS_DIR, { recursive: true })
fs.mkdirSync(SVG_DIR, { recursive: true })

const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'))
const withImages = products.filter((p) => p.firstImage && p.imageCount > 0)

console.log(`Total products: ${products.length}`)
console.log(`Products with images: ${withImages.length}`)
console.log(`Products without images: ${products.length - withImages.length}\n`)

function checkTools() {
  try {
    execSync('which magick', { stdio: 'pipe' })
  } catch {
    console.error('ERROR: ImageMagick (magick) not found. Install with: brew install imagemagick')
    process.exit(1)
  }
  try {
    execSync('which potrace', { stdio: 'pipe' })
  } catch {
    console.error('ERROR: potrace not found. Install with: brew install potrace')
    process.exit(1)
  }
}

async function downloadImage(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(destPath, buffer)
}

function convertToSvg(inputPath, outputPath) {
  const ppmPath = inputPath.replace(/\.[^.]+$/, '.ppm')

  try {
    execSync(
      `magick "${inputPath}" -resize 800x800\\> -threshold 50% -type bilevel "${ppmPath}"`,
      { stdio: 'pipe' }
    )
    execSync(`potrace "${ppmPath}" -s -o "${outputPath}"`, { stdio: 'pipe' })
    if (fs.existsSync(ppmPath)) fs.unlinkSync(ppmPath)
    return true
  } catch (err) {
    if (fs.existsSync(ppmPath)) fs.unlinkSync(ppmPath)
    console.error(`    Convert failed: ${err.message}`)
    return false
  }
}

async function main() {
  checkTools()

  let downloaded = 0
  let converted = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < withImages.length; i++) {
    const product = withImages[i]
    const handle = product.handle
    const ext = product.firstImage.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png'
    const origFile = path.join(ORIGINALS_DIR, `${handle}.${ext}`)
    const svgFile = path.join(SVG_DIR, `${handle}.svg`)

    const progress = `[${i + 1}/${withImages.length}]`

    if (fs.existsSync(svgFile)) {
      skipped++
      continue
    }

    process.stdout.write(`${progress} ${handle}...`)

    try {
      if (!fs.existsSync(origFile)) {
        await downloadImage(product.firstImage, origFile)
        downloaded++
      }

      const ok = convertToSvg(origFile, svgFile)
      if (ok) {
        converted++
        console.log(' done')
      } else {
        failed++
        console.log(' FAILED')
      }

      if (i % 10 === 0 && i > 0) {
        await new Promise((r) => setTimeout(r, 200))
      }
    } catch (err) {
      failed++
      console.log(` ERROR: ${err.message}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Converted to SVG: ${converted}`)
  console.log(`Skipped (already existed): ${skipped}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nOriginals: ${ORIGINALS_DIR}`)
  console.log(`SVGs: ${SVG_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
