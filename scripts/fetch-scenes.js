#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'
const PRODUCT_HANDLE = 'fireplace-tools-base-bear'

const ORIGINALS_DIR = path.join(__dirname, '..', 'public', 'signs', 'originals')
const SVG_DIR = path.join(__dirname, '..', 'public', 'signs', 'svgs')

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/fetch-scenes.js')
  process.exit(1)
}

function cleanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return 0
  }
  const files = fs.readdirSync(dir)
  files.forEach((f) => fs.unlinkSync(path.join(dir, f)))
  return files.length
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

function extractName(src, alt) {
  if (alt && alt.trim() && alt.trim() !== '' && !alt.includes('shopify')) {
    return alt.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  const filename = src.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '')
  return filename.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  console.log(`Fetching product "${PRODUCT_HANDLE}" from Shopify...\n`)

  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/products.json?handle=${PRODUCT_HANDLE}&fields=id,title,handle,images`,
    { headers: { 'X-Shopify-Access-Token': TOKEN } }
  )

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const data = await res.json()
  const product = data.products?.[0]
  if (!product) {
    console.error('Product not found!')
    process.exit(1)
  }

  console.log(`Product: "${product.title}" (${product.images.length} images)\n`)

  console.log('Image names that will be used:')
  product.images.forEach((img, i) => {
    const name = extractName(img.src, img.alt)
    console.log(`  ${i + 1}. ${name} (alt: "${img.alt || ''}")`)
  })

  console.log(`\nCleaning old files...`)
  const oldSvgs = cleanDirectory(SVG_DIR)
  const oldOrig = cleanDirectory(ORIGINALS_DIR)
  console.log(`  Removed ${oldSvgs} SVGs and ${oldOrig} originals\n`)

  let downloaded = 0
  let converted = 0
  let failed = 0

  for (let i = 0; i < product.images.length; i++) {
    const img = product.images[i]
    const name = extractName(img.src, img.alt)
    const ext = img.src.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png'
    const origFile = path.join(ORIGINALS_DIR, `${name}.${ext}`)
    const svgFile = path.join(SVG_DIR, `${name}.svg`)

    process.stdout.write(`[${i + 1}/${product.images.length}] ${name}...`)

    try {
      await downloadImage(img.src, origFile)
      downloaded++

      const ok = convertToSvg(origFile, svgFile)
      if (ok) {
        converted++
        console.log(' done')
      } else {
        failed++
        console.log(' FAILED')
      }
    } catch (err) {
      failed++
      console.log(` ERROR: ${err.message}`)
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Total images: ${product.images.length}`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Converted to SVG: ${converted}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nOriginals: ${ORIGINALS_DIR}`)
  console.log(`SVGs: ${SVG_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
