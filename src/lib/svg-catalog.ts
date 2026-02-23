export interface SvgAsset {
  id: string
  filename: string
  url: string
  label: string
}

export interface DesignCatalog {
  scenes: SvgAsset[]
  silhouettes: SvgAsset[]
}

export async function loadDesignCatalog(): Promise<DesignCatalog> {
  try {
    const response = await fetch('/api/signs')
    if (!response.ok) throw new Error('Failed to load catalog')
    return response.json()
  } catch {
    return { scenes: [], silhouettes: [] }
  }
}
