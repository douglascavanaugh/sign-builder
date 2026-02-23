const SHOPIFY_STORE = 'https://allwayzmags.com'

const VARIANT_MAP: Record<string, number> = {
  "12x18": 45100697682115,
  "12x18.5": 45100697714883,
  "12x36": 45100697747651,
  "16x40": 45100697780419,
  "18x24": 45100697813187,
  "23x37": 45100697845955,
  "23x39": 45100697878723,
  "24x36": 45100697911491,
  "24x37": 45100697944259,
  "24x39": 45100697977027,
  "24x48": 45100698009795,
  "25x30": 45100698042563,
  "25x40": 45100698075331,
  "25x59": 45100698108099,
  "25x60": 45100698140867,
  "26x36": 45100698173635,
  "26x39": 45100698206403,
  "26x59": 45100698239171,
  "26x60": 45100698271939,
  "31x58": 45100698304707,
  "34x39": 45100698337475,
  "35x53": 45100698370243,
  "35x59": 45100698403011,
  "36x45": 45100698435779,
  "36x55": 45100698468547,
  "36x57": 45100698501315,
  "36x58": 45100698534083,
  "36x58.5": 45100698566851,
  "36x59": 45100698599619,
  "36x60": 45100698632387,
}

export function getVariantId(templateId: string): number | null {
  return VARIANT_MAP[templateId] || null
}

export async function uploadDesignImage(
  pngDataUrl: string,
  productCode: string,
  templateId: string
): Promise<string> {
  const res = await fetch('/api/upload-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: pngDataUrl,
      productCode,
      templateId,
    }),
  })

  if (!res.ok) throw new Error('Failed to upload design image')
  const data = await res.json()
  return data.url
}

export function addToShopifyCart(
  variantId: number,
  designImageUrl: string,
  productCode: string,
  templateName: string,
) {
  const properties = encodeURIComponent(
    `Design Image=${designImageUrl}&Product Code=${productCode}&Size=${templateName}`
  )
    .replace(/%3D/g, '=')
    .replace(/%26/g, '&')

  const cartUrl = `${SHOPIFY_STORE}/cart/${variantId}:1?properties[Design_Image]=${encodeURIComponent(designImageUrl)}&properties[Product_Code]=${encodeURIComponent(productCode)}&properties[Size]=${encodeURIComponent(templateName)}`

  window.top?.location.assign(cartUrl)
}
