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
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/scan-all-scenes.js')
  process.exit(1)
}

const SCENE_OPTION_KEYWORDS = [
  'scene', 'silhouette', 'choose a scene', 'design', 'choose a design',
  'top scene', 'choose scene', 'choose silhouette', 'select a scene',
]

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
    console.log(`Fetching products... (${products.length} so far)`)
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
    })

    if (!res.ok) {
      console.error(`API error: ${res.status}`)
      process.exit(1)
    }

    const data = await res.json()
    products = products.concat(data.products)

    const link = res.headers.get('link')
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  return products
}

async function main() {
  console.log('Scanning ALL Shopify products for scene/design options...\n')

  const products = await fetchAllProducts()
  console.log(`\nTotal products: ${products.length}\n`)

  const allScenes = new Map()
  const productsWithScenes = []

  for (const product of products) {
    if (!product.options || !product.variants) continue

    for (let optIdx = 0; optIdx < product.options.length; optIdx++) {
      const option = product.options[optIdx]
      const optNameLower = option.name.toLowerCase()

      const isSceneOption = SCENE_OPTION_KEYWORDS.some((kw) => optNameLower.includes(kw))
      if (!isSceneOption) continue

      const optionKey = `option${optIdx + 1}`
      const imageMap = new Map()
      if (product.images) {
        product.images.forEach((img) => imageMap.set(img.id, img.src))
      }

      const scenesInProduct = []

      for (const variant of product.variants) {
        const sceneName = variant[optionKey]
        if (!sceneName) continue

        const slug = slugify(sceneName)
        if (!slug || allScenes.has(slug)) continue

        const imageSrc = variant.image_id ? imageMap.get(variant.image_id) : null
        if (imageSrc) {
          allScenes.set(slug, { src: imageSrc, label: sceneName })
          scenesInProduct.push(sceneName)
        }
      }

      if (scenesInProduct.length > 0) {
        productsWithScenes.push({
          handle: product.handle,
          title: product.title,
          option: option.name,
          newScenes: scenesInProduct.length,
        })
      }
    }
  }

  console.log('=== PRODUCTS WITH SCENE OPTIONS ===')
  productsWithScenes.forEach((p) => {
    console.log(`  ${p.handle} — "${p.title}" [${p.option}] → ${p.newScenes} new scenes`)
  })

  const sorted = [...allScenes.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  console.log(`\n=== ALL UNIQUE SCENES: ${sorted.length} ===`)
  sorted.forEach(([slug, { label }], i) => {
    console.log(`  ${i + 1}. ${slug} (${label})`)
  })

  console.log(`\nCleaning old files...`)
  const oldSvgs = cleanDirectory(SVG_DIR)
  const oldOrig = cleanDirectory(ORIGINALS_DIR)
  console.log(`  Removed ${oldSvgs} SVGs and ${oldOrig} originals\n`)

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
  console.log(`Products with scene options: ${productsWithScenes.length}`)
  console.log(`Unique scenes found: ${allScenes.size}`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Converted to SVG: ${converted}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nSVGs: ${SVG_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
