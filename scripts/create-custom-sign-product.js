#!/usr/bin/env node

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/create-custom-sign-product.js')
  process.exit(1)
}

const SIGN_SIZES = [
  '12x18', '12x18.5', '12x36', '16x40', '18x24',
  '23x37', '23x39', '24x36', '24x37', '24x39', '24x48',
  '25x30', '25x40', '25x59', '25x60',
  '26x36', '26x39', '26x59', '26x60',
  '31x58', '34x39',
  '35x53', '35x59',
  '36x45', '36x55', '36x57', '36x58', '36x58.5', '36x59', '36x60',
]

async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
  }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${endpoint}`, options)
  const data = await res.json()

  if (!res.ok) {
    console.error(`API Error (${res.status}):`, JSON.stringify(data, null, 2))
    return null
  }
  return data
}

async function main() {
  console.log('Checking if "Custom Sign" product already exists...')

  const existing = await shopifyRequest('/products.json?handle=custom-sign&fields=id,title,handle,variants')
  if (existing?.products?.length > 0) {
    const p = existing.products[0]
    console.log(`\nProduct already exists!`)
    console.log(`  ID: ${p.id}`)
    console.log(`  Title: ${p.title}`)
    console.log(`  Variants: ${p.variants.length}`)
    p.variants.forEach((v) => console.log(`    ${v.id}: ${v.title} — $${v.price}`))
    return
  }

  console.log('Creating "Custom Sign" product with size variants...\n')

  const variants = SIGN_SIZES.map((size) => {
    const [w, h] = size.split('x')
    const area = parseFloat(w) * parseFloat(h)
    let price = '0.00'
    if (area <= 300) price = '49.99'
    else if (area <= 600) price = '79.99'
    else if (area <= 1000) price = '119.99'
    else if (area <= 1500) price = '159.99'
    else price = '199.99'

    return {
      option1: `${w}" × ${h}"`,
      price,
      requires_shipping: true,
      taxable: true,
      inventory_management: null,
    }
  })

  const product = {
    product: {
      title: 'Custom Sign',
      handle: 'custom-sign',
      body_html: '<p>Design your own custom metal sign! Choose from our library of scenes and silhouettes, add your own text, and select your size. Each sign is laser-cut from premium steel and powder-coated for lasting durability.</p>',
      vendor: 'AllwayzMags',
      product_type: 'Custom Signs',
      tags: 'custom, sign, metal, laser-cut, personalized',
      published: true,
      options: [{ name: 'Size' }],
      variants,
    },
  }

  const result = await shopifyRequest('/products.json', 'POST', product)

  if (result?.product) {
    console.log('Product created successfully!')
    console.log(`  ID: ${result.product.id}`)
    console.log(`  Handle: ${result.product.handle}`)
    console.log(`  URL: https://allwayzmags.com/products/custom-sign`)
    console.log(`\n  Variants:`)
    result.product.variants.forEach((v) => {
      console.log(`    ${v.id}: ${v.title} — $${v.price}`)
    })

    console.log('\n  NOTE: Prices are placeholder estimates based on area.')
    console.log('  Update them in Shopify admin if needed.')
    console.log(`\n  Saving variant map...`)

    const variantMap = {}
    result.product.variants.forEach((v) => {
      const sizeKey = v.title
        .replace(/"/g, '')
        .replace(/\s*×\s*/g, 'x')
        .replace(/½/g, '.5')
      variantMap[sizeKey] = v.id
    })

    const fs = require('fs')
    const path = require('path')
    const mapPath = path.join(__dirname, '..', 'shopify-variant-map.json')
    fs.writeFileSync(mapPath, JSON.stringify(variantMap, null, 2))
    console.log(`  Saved to: ${mapPath}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
