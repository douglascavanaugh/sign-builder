'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, ImageOff, ChevronDown, ChevronRight, Mountain, Squirrel } from 'lucide-react'
import type { SvgAsset, DesignCatalog } from '@/lib/svg-catalog'
import { cn } from '@/lib/cn'

interface SvgLibraryProps {
  onAddToCanvas: (svgUrl: string, assetId: string) => void
}

function DesignGrid({
  assets,
  onAddToCanvas,
}: {
  assets: SvgAsset[]
  onAddToCanvas: (svgUrl: string, assetId: string) => void
}) {
  const handleDragStart = useCallback((e: React.DragEvent, asset: SvgAsset) => {
    e.dataTransfer.setData('text/plain', asset.url)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-stone-400">
        <ImageOff className="w-6 h-6 mb-1" />
        <p className="text-xs">No designs yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {assets.map((asset) => (
        <button
          key={asset.id}
          onClick={() => onAddToCanvas(asset.url, asset.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, asset)}
          className={cn(
            'group relative aspect-square rounded-md border border-stone-200 bg-white',
            'hover:border-brand-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing',
            'flex items-center justify-center p-1.5 overflow-hidden'
          )}
          title={asset.label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.url}
            alt={asset.label}
            className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  )
}

export default function SvgLibrary({ onAddToCanvas }: SvgLibraryProps) {
  const [catalog, setCatalog] = useState<DesignCatalog>({ scenes: [], silhouettes: [] })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [scenesOpen, setScenesOpen] = useState(true)
  const [silhouettesOpen, setSilhouettesOpen] = useState(true)

  useEffect(() => {
    fetch('/api/signs')
      .then((r) => r.json())
      .then((data: DesignCatalog) => setCatalog(data))
      .catch(() => setCatalog({ scenes: [], silhouettes: [] }))
      .finally(() => setLoading(false))
  }, [])

  const filterAssets = (assets: SvgAsset[]) => {
    if (!search.trim()) return assets
    const q = search.toLowerCase()
    return assets.filter((a) => a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
  }

  const filteredScenes = filterAssets(catalog.scenes)
  const filteredSilhouettes = filterAssets(catalog.silhouettes)
  const totalCount = filteredScenes.length + filteredSilhouettes.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-stone-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all designs..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-stone-100 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-stone-400 mt-1.5">{totalCount} designs available</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Scenes Section */}
        <div className="border-b border-stone-200">
          <button
            onClick={() => setScenesOpen(!scenesOpen)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {scenesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Mountain className="w-4 h-4 text-brand-500" />
            <span>Scenes</span>
            <span className="text-xs text-stone-400 ml-auto">{filteredScenes.length}</span>
          </button>
          {scenesOpen && (
            <DesignGrid assets={filteredScenes} onAddToCanvas={onAddToCanvas} />
          )}
        </div>

        {/* Silhouettes Section */}
        <div className="border-b border-stone-200">
          <button
            onClick={() => setSilhouettesOpen(!silhouettesOpen)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {silhouettesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Squirrel className="w-4 h-4 text-brand-500" />
            <span>Silhouettes</span>
            <span className="text-xs text-stone-400 ml-auto">{filteredSilhouettes.length}</span>
          </button>
          {silhouettesOpen && (
            <DesignGrid assets={filteredSilhouettes} onAddToCanvas={onAddToCanvas} />
          )}
        </div>
      </div>
    </div>
  )
}
