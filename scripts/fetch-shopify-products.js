#!/usr/bin/env node

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/fetch-shopify-products.js')
  process.exit(1)
}

async function fetchAllProducts() {
  let products = []
  let url = `https://${SHOP}/admin/api/${API_VERSION}/products.json?limit=250&fields=id,title,handle,images`

  while (url) {
    console.log(`Fetching: ${url.substring(0, 80)}...`)
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
    })

    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`)
      const body = await res.text()
      console.error(body)
      process.exit(1)
    }

    const data = await res.json()
    products = products.concat(data.products)
    console.log(`  Got ${data.products.length} products (total: ${products.length})`)

    const link = res.headers.get('link')
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)
    url = next ? next[1] : null
  }

  return products
}

async function main() {
  console.log('Fetching products from Shopify...\n')
  const products = await fetchAllProducts()

  console.log(`\nTotal products: ${products.length}\n`)

  const summary = products.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    imageCount: p.images?.length || 0,
    firstImage: p.images?.[0]?.src || null,
  }))

  const fs = require('fs')
  const outPath = require('path').join(__dirname, '..', 'shopify-products.json')
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2))
  console.log(`Product list saved to: ${outPath}`)

  summary.forEach((p) => {
    console.log(`  ${p.handle} — "${p.title}" (${p.imageCount} images)`)
  })
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
