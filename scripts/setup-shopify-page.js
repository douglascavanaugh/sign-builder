#!/usr/bin/env node

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'
const SIGN_BUILDER_URL = 'https://sign-builder.vercel.app'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx node scripts/setup-shopify-page.js')
  process.exit(1)
}

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
  console.log(`Creating "Custom Signs" page embedding: ${SIGN_BUILDER_URL}\n`)

  const pageHtml = `<style>
  .template-page .main-content,
  .template-page .page-width,
  .template-page .shopify-section,
  .template-page .rte,
  .template-page main .page-width,
  .template-page .section-template--page,
  .main-page-content .page-width,
  .shopify-section--template--page .page-width,
  #MainContent .page-width,
  #shopify-section-template--page .page-width,
  .page-content .page-width,
  article .page-width,
  article .rte {
    max-width: 100% !important;
    width: 100% !important;
    padding-left: 100px !important;
    padding-right: 100px !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
</style>
<div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;padding:0 100px;box-sizing:border-box;">
  <iframe
    src="${SIGN_BUILDER_URL}"
    style="width:100%;height:90vh;border:none;"
    allow="clipboard-write"
    title="Custom Sign Builder"
  ></iframe>
</div>`

  const result = await shopifyRequest('/pages.json', 'POST', {
    page: {
      title: 'Custom Signs - Coming Soon',
      handle: 'custom-signs',
      body_html: pageHtml,
      published: true,
    },
  })

  if (result?.page) {
    console.log(`Page created successfully!`)
    console.log(`  ID: ${result.page.id}`)
    console.log(`  URL: https://allwayzmags.com/pages/custom-signs\n`)
  } else {
    console.log('Page may already exist. Checking...')
    const existing = await shopifyRequest('/pages.json?handle=custom-signs')
    if (existing?.pages?.length > 0) {
      console.log(`  Found existing page: ${existing.pages[0].id}`)
      console.log(`  Updating it...`)
      await shopifyRequest(`/pages/${existing.pages[0].id}.json`, 'PUT', {
        page: { title: 'Custom Signs - Coming Soon', body_html: pageHtml },
      })
      console.log(`  Updated!\n`)
    }
  }

  console.log('--- NEXT STEP ---')
  console.log('Add "Custom Signs" to your main menu:')
  console.log('  1. Go to: https://allwayzmags.myshopify.com/admin/menus')
  console.log('  2. Click on your main menu')
  console.log('  3. Click "Add menu item"')
  console.log('  4. Name: Custom Signs')
  console.log('  5. Link: select Pages > Custom Signs')
  console.log('  6. Save menu')
  console.log(`\nThen visit: https://allwayzmags.com/pages/custom-signs`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
