import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SHOP = 'allwayzmags.myshopify.com'
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!
const API_VERSION = '2024-01'

async function shopifyGraphQL(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const { image, productCode, templateId } = await request.json()

    if (!image || !image.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = `custom-sign-${productCode || 'design'}-${templateId || 'custom'}-${Date.now()}.png`

    const stagedResult = await shopifyGraphQL(`
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      input: [{
        resource: 'FILE',
        filename,
        mimeType: 'image/png',
        httpMethod: 'POST',
        fileSize: String(buffer.length),
      }],
    })

    const target = stagedResult.data?.stagedUploadsCreate?.stagedTargets?.[0]
    if (!target) {
      const errors = stagedResult.data?.stagedUploadsCreate?.userErrors
      console.error('Staged upload error:', errors || stagedResult)
      return NextResponse.json({ error: 'Failed to create upload target' }, { status: 500 })
    }

    const formData = new FormData()
    target.parameters.forEach((param: { name: string; value: string }) => {
      formData.append(param.name, param.value)
    })
    formData.append('file', new Blob([buffer], { type: 'image/png' }), filename)

    const uploadRes = await fetch(target.url, {
      method: 'POST',
      body: formData,
    })

    if (!uploadRes.ok) {
      console.error('Upload failed:', uploadRes.status, await uploadRes.text())
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const fileResult = await shopifyGraphQL(`
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            ... on MediaImage {
              id
              image {
                url
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      files: [{
        originalSource: target.resourceUrl,
        filename,
        alt: `Custom sign design - ${productCode || 'custom'} - ${templateId}`,
        contentType: 'IMAGE',
      }],
    })

    const fileErrors = fileResult.data?.fileCreate?.userErrors
    if (fileErrors?.length > 0) {
      console.error('File create errors:', fileErrors)
      return NextResponse.json({ error: 'Failed to register file' }, { status: 500 })
    }

    const shopifyFile = fileResult.data?.fileCreate?.files?.[0]
    let imageUrl = shopifyFile?.image?.url

    if (!imageUrl) {
      imageUrl = target.resourceUrl
    }

    return NextResponse.json({ url: imageUrl, filename })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
