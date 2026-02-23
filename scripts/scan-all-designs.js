#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

const ORIGINALS_DIR = path.join(__dirname, '..', 'public', 'signs', 'originals')
const SVG_DIR = path.join(__dirname, '..', 'public', 'signs', 'svgs')

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/scan-all-designs.js')
  process.exit(1)
}

const SKIP_OPTIONS = ['color', 'colour', 'size', 'length', 'material', 'finish', 'qty', 'quantity']

function slugify(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
    return false
  }
}

async function fetchAllProducts() {
  let products = []
  let url = `https://${SHOP}/admin/api/${API_VERSION}/products.json?limit=250`

  while (url) {
    process.stdout.write(`\rFetching products... (${products.length} so far)`)
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
    })

    if (!res.ok) {
      console.error(`\nAPI error: ${res.status}`)
      process.exit(1)
    }

    const data = await res.json()
    products = products.concat(data.products)

    const link = res.headers.get('link')
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  console.log(`\rFetched ${products.length} products.                    `)
  return products
}

async function main() {
  console.log('Scanning ALL products for design/silhouette variant options...\n')

  const products = await fetchAllProducts()

  // PHASE 1: Discover all option names that have associated images
  console.log('\n=== PHASE 1: Discovering design option names ===\n')
  const optionNameCounts = new Map()

  for (const product of products) {
    if (!product.options || !product.variants || !product.images) continue

    const imageMap = new Map()
    product.images.forEach((img) => imageMap.set(img.id, img.src))

    for (let optIdx = 0; optIdx < product.options.length; optIdx++) {
      const option = product.options[optIdx]
      const nameLower = option.name.toLowerCase().trim()

      if (SKIP_OPTIONS.some((skip) => nameLower === skip)) continue

      const optionKey = `option${optIdx + 1}`
      let hasImageVariants = false

      for (const variant of product.variants) {
        if (variant[optionKey] && variant.image_id && imageMap.has(variant.image_id)) {
          hasImageVariants = true
          break
        }
      }

      if (hasImageVariants) {
        const count = optionNameCounts.get(option.name) || { count: 0, products: [] }
        count.count++
        count.products.push(product.handle)
        optionNameCounts.set(option.name, count)
      }
    }
  }

  console.log('Option names with image-backed variants:')
  const sortedOptions = [...optionNameCounts.entries()].sort((a, b) => b[1].count - a[1].count)
  sortedOptions.forEach(([name, { count, products: prods }]) => {
    console.log(`  "${name}" — found in ${count} products`)
    prods.slice(0, 3).forEach((h) => console.log(`    e.g. ${h}`))
    if (prods.length > 3) console.log(`    ... and ${prods.length - 3} more`)
  })

  // PHASE 2: Collect all unique designs from ALL design-type options
  console.log('\n=== PHASE 2: Collecting unique designs ===\n')
  const allDesigns = new Map()
  const productsUsed = []

  for (const product of products) {
    if (!product.options || !product.variants || !product.images) continue

    const imageMap = new Map()
    product.images.forEach((img) => imageMap.set(img.id, img.src))

    for (let optIdx = 0; optIdx < product.options.length; optIdx++) {
      const option = product.options[optIdx]
      const nameLower = option.name.toLowerCase().trim()

      if (SKIP_OPTIONS.some((skip) => nameLower === skip)) continue

      const optionKey = `option${optIdx + 1}`
      let newCount = 0

      for (const variant of product.variants) {
        const designName = variant[optionKey]
        if (!designName) continue

        const slug = slugify(designName)
        if (!slug || allDesigns.has(slug)) continue

        const imageSrc = variant.image_id ? imageMap.get(variant.image_id) : null
        if (imageSrc) {
          allDesigns.set(slug, { src: imageSrc, label: designName })
          newCount++
        }
      }

      if (newCount > 0) {
        productsUsed.push({
          handle: product.handle,
          option: option.name,
          newDesigns: newCount,
        })
      }
    }
  }

  console.log(`Products contributing designs: ${productsUsed.length}`)
  productsUsed.forEach((p) => {
    console.log(`  ${p.handle} [${p.option}] → ${p.newDesigns} new designs`)
  })

  const sorted = [...allDesigns.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  console.log(`\n=== ALL UNIQUE DESIGNS: ${sorted.length} ===`)
  sorted.forEach(([slug, { label }], i) => {
    console.log(`  ${i + 1}. ${slug} (${label})`)
  })

  // Save the list before downloading
  const listPath = path.join(__dirname, '..', 'design-list.json')
  fs.writeFileSync(listPath, JSON.stringify(
    sorted.map(([slug, { label }]) => ({ slug, label })),
    null, 2
  ))
  console.log(`\nDesign list saved to: ${listPath}`)

  // Ask-style confirmation via output
  console.log(`\nReady to download and convert ${sorted.length} designs.`)
  console.log('Proceeding...\n')

  const oldSvgs = cleanDirectory(SVG_DIR)
  const oldOrig = cleanDirectory(ORIGINALS_DIR)
  console.log(`Cleaned: ${oldSvgs} old SVGs, ${oldOrig} old originals\n`)

  let downloaded = 0
  let converted = 0
  let failed = 0

  for (let i = 0; i < sorted.length; i++) {
    const [slug, { src }] = sorted[i]
    const ext = src.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png'
    const origFile = path.join(ORIGINALS_DIR, `${slug}.${ext}`)
    const svgFile = path.join(SVG_DIR, `${slug}.svg`)

    process.stdout.write(`[${i + 1}/${sorted.length}] ${slug}...`)

    try {
      await downloadImage(src, origFile)
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

  console.log('\n--- FINAL SUMMARY ---')
  console.log(`Products scanned: ${products.length}`)
  console.log(`Products with design options: ${productsUsed.length}`)
  console.log(`Unique designs found: ${allDesigns.size}`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Converted to SVG: ${converted}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nSVGs: ${SVG_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
