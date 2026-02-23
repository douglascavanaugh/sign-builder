#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'
const PRODUCT_HANDLE = 'paper-towel-holder-scene'

const ORIGINALS_DIR = path.join(__dirname, '..', 'public', 'signs', 'originals')
const SVG_DIR = path.join(__dirname, '..', 'public', 'signs', 'svgs')

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/fetch-paper-towel-scenes.js')
  process.exit(1)
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

  const existingSvgs = fs.existsSync(SVG_DIR) ? new Set(fs.readdirSync(SVG_DIR).map((f) => f.replace('.svg', ''))) : new Set()
  console.log(`Existing SVGs in library: ${existingSvgs.size}\n`)

  let newImages = []
  product.images.forEach((img, i) => {
    const name = extractName(img.src, img.alt)
    const isNew = !existingSvgs.has(name)
    console.log(`  ${i + 1}. ${name}${isNew ? ' [NEW]' : ' [already exists]'} (alt: "${img.alt || ''}")`)
    if (isNew) newImages.push({ ...img, name })
  })

  console.log(`\nNew images to add: ${newImages.length}`)
  console.log(`Will skip: ${product.images.length - newImages.length} (already exist)\n`)

  let downloaded = 0
  let converted = 0
  let failed = 0

  for (let i = 0; i < newImages.length; i++) {
    const img = newImages[i]
    const ext = img.src.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png'
    const origFile = path.join(ORIGINALS_DIR, `${img.name}.${ext}`)
    const svgFile = path.join(SVG_DIR, `${img.name}.svg`)

    process.stdout.write(`[${i + 1}/${newImages.length}] ${img.name}...`)

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

  const totalSvgs = fs.readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg')).length

  console.log('\n--- Summary ---')
  console.log(`Images in product: ${product.images.length}`)
  console.log(`New images added: ${converted}`)
  console.log(`Skipped (duplicates): ${product.images.length - newImages.length}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nTotal SVGs in library now: ${totalSvgs}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
