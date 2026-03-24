#!/usr/bin/env node

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/update-page-title.js')
  process.exit(1)
}

async function main() {
  console.log('Finding Custom Signs page...')

  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/pages.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  })
  const data = await res.json()

  const page = data.pages.find((p) => p.handle === 'custom-signs')
  if (!page) {
    console.log('All pages:')
    data.pages.forEach((p) => console.log(`  ${p.id}: "${p.title}" (handle: ${p.handle})`))
    console.error('\nCould not find custom-signs page!')
    process.exit(1)
  }

  console.log(`Found page: ${page.id} — "${page.title}"`)
  console.log('Updating title to "Custom Signs - Coming Soon"...')

  const updateRes = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/pages/${page.id}.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: { id: page.id, title: 'Custom Signs - Coming Soon' },
    }),
  })

  const result = await updateRes.json()

  if (updateRes.ok) {
    console.log(`Updated! New title: "${result.page.title}"`)
  } else {
    console.error('Update failed:', JSON.stringify(result, null, 2))
  }
}

main().catch(console.error)
