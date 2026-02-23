#!/usr/bin/env node

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_TOKEN
const API_VERSION = '2024-01'

if (!TOKEN) {
  console.error('Usage: SHOPIFY_TOKEN=shpat_xxx SIGN_BUILDER_URL=https://your-app.vercel.app node scripts/setup-shopify-page.js')
  process.exit(1)
}

const SIGN_BUILDER_URL = process.env.SIGN_BUILDER_URL || 'https://sign-builder.vercel.app'

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

async function createPage() {
  console.log('Creating "Custom Signs" page...')

  const pageHtml = `
<div style="width:100%;max-width:1400px;margin:0 auto;padding:0;">
  <iframe
    src="${SIGN_BUILDER_URL}"
    style="width:100%;height:90vh;border:none;border-radius:8px;"
    allow="clipboard-write"
    title="Custom Sign Builder"
  ></iframe>
</div>
<style>
  .shopify-section-template--custom-signs .page-width { max-width: 100% !important; padding: 0 !important; }
  .main-content { padding: 0 !important; }
</style>`.trim()

  const result = await shopifyRequest('/pages.json', 'POST', {
    page: {
      title: 'Custom Signs',
      handle: 'custom-signs',
      body_html: pageHtml,
      published: true,
    },
  })

  if (result?.page) {
    console.log(`  Page created: ${result.page.id}`)
    console.log(`  URL: https://allwayzmags.com/pages/custom-signs`)
    return result.page
  } else {
    console.log('  Page may already exist, checking...')
    const existing = await shopifyRequest('/pages.json?handle=custom-signs')
    if (existing?.pages?.length > 0) {
      console.log(`  Found existing page: ${existing.pages[0].id}`)
      return existing.pages[0]
    }
  }
  return null
}

async function addMenuItem() {
  console.log('\nLooking for main menu...')

  const menus = await shopifyRequest('/menus.json')

  if (!menus?.menus) {
    console.log('  Could not fetch menus via REST API.')
    console.log('  You can add the menu item manually in Shopify:')
    console.log('  Settings > Navigation > Main menu > Add menu item')
    console.log('  Name: Custom Signs')
    console.log('  Link: /pages/custom-signs')
    return
  }

  const mainMenu = menus.menus.find((m) =>
    m.handle === 'main-menu' || m.handle === 'main' || m.title.toLowerCase().includes('main')
  )

  if (!mainMenu) {
    console.log('  Main menu not found. Available menus:')
    menus.menus.forEach((m) => console.log(`    - ${m.handle}: "${m.title}"`))
    console.log('\n  Add the menu item manually:')
    console.log('  Settings > Navigation > Main menu > Add menu item')
    console.log('  Name: Custom Signs')
    console.log('  Link: /pages/custom-signs')
    return
  }

  console.log(`  Found main menu: "${mainMenu.title}" (${mainMenu.handle})`)
  console.log('  Adding "Custom Signs" link...')

  console.log('\n  NOTE: Shopify REST API menu editing is limited.')
  console.log('  Please add the menu item manually:')
  console.log('  Go to: allwayzmags.myshopify.com/admin/menus')
  console.log('  Edit main menu > Add menu item:')
  console.log('    Name: Custom Signs')
  console.log('    Link: /pages/custom-signs')
}

async function main() {
  console.log(`Sign Builder URL: ${SIGN_BUILDER_URL}\n`)

  await createPage()
  await addMenuItem()

  console.log('\n--- DONE ---')
  console.log('Next steps:')
  console.log('1. Deploy sign-builder to Vercel and get the URL')
  console.log('2. If needed, re-run this script with the correct SIGN_BUILDER_URL')
  console.log('3. Add "Custom Signs" to your main menu in Shopify admin')
  console.log(`4. Visit https://allwayzmags.com/pages/custom-signs to test`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
