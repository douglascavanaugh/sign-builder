#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'
const PRODUCT_HANDLE = 'paper-towel-holder-scene'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/deep-fetch-product.js')
  process.exit(1)
}

async function main() {
  console.log(`Deep-fetching "${PRODUCT_HANDLE}"...\n`)

  const res = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/products.json?handle=${PRODUCT_HANDLE}`,
    { headers: { 'X-Shopify-Access-Token': TOKEN } }
  )

  const data = await res.json()
  const product = data.products?.[0]
  if (!product) {
    console.error('Product not found!')
    process.exit(1)
  }

  console.log(`Title: "${product.title}"`)
  console.log(`ID: ${product.id}`)
  console.log(`Images: ${product.images.length}`)
  console.log(`Variants: ${product.variants.length}`)
  console.log(`Options: ${product.options.map((o) => `${o.name} (${o.values.length} values)`).join(', ')}`)

  console.log('\n=== OPTIONS & VALUES ===')
  product.options.forEach((opt) => {
    console.log(`\n  ${opt.name}:`)
    opt.values.forEach((v, i) => console.log(`    ${i + 1}. ${v}`))
  })

  console.log('\n=== VARIANTS (first 20) ===')
  product.variants.slice(0, 20).forEach((v, i) => {
    console.log(`  ${i + 1}. "${v.title}" (image_id: ${v.image_id || 'none'})`)
  })
  if (product.variants.length > 20) {
    console.log(`  ... and ${product.variants.length - 20} more variants`)
  }

  console.log('\n=== ALL IMAGES ===')
  product.images.forEach((img, i) => {
    const filename = img.src.split('/').pop().split('?')[0]
    console.log(`  ${i + 1}. id:${img.id} alt:"${img.alt || ''}" file:${filename}`)
    if (img.variant_ids?.length) {
      console.log(`     variant_ids: [${img.variant_ids.join(', ')}]`)
    }
  })

  // Check for images in body_html
  const bodyImages = product.body_html?.match(/src="([^"]+)"/g) || []
  if (bodyImages.length > 0) {
    console.log(`\n=== IMAGES IN DESCRIPTION HTML (${bodyImages.length}) ===`)
    bodyImages.forEach((src, i) => {
      console.log(`  ${i + 1}. ${src.replace('src="', '').replace('"', '')}`)
    })
  }

  // Save full product data for inspection
  const outPath = path.join(__dirname, '..', 'paper-towel-product-full.json')
  fs.writeFileSync(outPath, JSON.stringify(product, null, 2))
  console.log(`\nFull product data saved to: ${outPath}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
