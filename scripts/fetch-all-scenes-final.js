#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

const PRODUCT_HANDLES = [
  'fireplace-tools-base-bear',
  'paper-towel-holder-scene',
]

const ORIGINALS_DIR = path.join(__dirname, '..', 'public', 'signs', 'originals')
const SVG_DIR = path.join(__dirname, '..', 'public', 'signs', 'svgs')

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/fetch-all-scenes-final.js')
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
    return false
  }
}

function slugify(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  const allScenes = new Map()

  for (const handle of PRODUCT_HANDLES) {
    console.log(`\nFetching "${handle}"...`)

    const res = await fetch(
      `https://${SHOP}/admin/api/${API_VERSION}/products.json?handle=${handle}`,
      { headers: { 'X-Shopify-Access-Token': TOKEN } }
    )
    const data = await res.json()
    const product = data.products?.[0]
    if (!product) {
      console.error(`  Product not found: ${handle}`)
      continue
    }

    console.log(`  "${product.title}" — ${product.images.length} images, ${product.variants.length} variants`)

    const imageMap = new Map()
    product.images.forEach((img) => imageMap.set(img.id, img.src))

    const sceneOption = product.options.find((o) =>
      o.name.toLowerCase().includes('scene') ||
      o.name.toLowerCase().includes('silhouette') ||
      o.name.toLowerCase().includes('choose')
    )

    if (!sceneOption) {
      console.log(`  No scene option found, using all images with filenames`)
      product.images.forEach((img) => {
        const filename = img.src.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '')
        let name = filename
          .replace(/^scene-many-uses-/i, '')
          .replace(/^paper-towel-holder-scene-final-?/i, '')
          .replace(/_[a-f0-9]{8}-[a-f0-9-]+$/i, '')
        name = slugify(name)
        if (name && !allScenes.has(name)) {
          allScenes.set(name, img.src)
        }
      })
      continue
    }

    console.log(`  Scene option: "${sceneOption.name}" (${sceneOption.values.length} values)`)

    const sceneOptionIndex = product.options.findIndex((o) => o.name === sceneOption.name)
    const optionKey = `option${sceneOptionIndex + 1}`

    product.variants.forEach((variant) => {
      const sceneName = variant[optionKey]
      if (!sceneName) return

      const slug = slugify(sceneName)
      if (allScenes.has(slug)) return

      const imageId = variant.image_id
      const imageSrc = imageId ? imageMap.get(imageId) : null

      if (imageSrc) {
        allScenes.set(slug, imageSrc)
      }
    })
  }

  console.log(`\n=== UNIQUE SCENES FOUND: ${allScenes.size} ===`)
  const sorted = [...allScenes.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  sorted.forEach(([name], i) => console.log(`  ${i + 1}. ${name}`))

  console.log(`\nCleaning old files...`)
  const oldSvgs = cleanDirectory(SVG_DIR)
  const oldOrig = cleanDirectory(ORIGINALS_DIR)
  console.log(`  Removed ${oldSvgs} SVGs and ${oldOrig} originals\n`)

  let downloaded = 0
  let converted = 0
  let failed = 0

  for (let i = 0; i < sorted.length; i++) {
    const [name, src] = sorted[i]
    const ext = src.match(/\.(png|jpg|jpeg|webp|gif)/i)?.[1] || 'png'
    const origFile = path.join(ORIGINALS_DIR, `${name}.${ext}`)
    const svgFile = path.join(SVG_DIR, `${name}.svg`)

    process.stdout.write(`[${i + 1}/${sorted.length}] ${name}...`)

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
  console.log(`Unique scenes: ${allScenes.size}`)
  console.log(`Downloaded: ${downloaded}`)
  console.log(`Converted to SVG: ${converted}`)
  console.log(`Failed: ${failed}`)
  console.log(`\nSVGs: ${SVG_DIR}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
