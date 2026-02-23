'use client'

import { cn } from '@/lib/cn'
import { Paintbrush } from 'lucide-react'
import { useState } from 'react'

const PRESET_COLORS = [
  { id: 'white', hex: '#FFFFFF', label: 'White', border: true },
  { id: 'black', hex: '#1c1917', label: 'Black' },
  { id: 'stone', hex: '#78716c', label: 'Stone' },
  { id: 'red', hex: '#dc2626', label: 'Red' },
  { id: 'orange', hex: '#ea580c', label: 'Orange' },
  { id: 'amber', hex: '#d97706', label: 'Amber' },
  { id: 'green', hex: '#16a34a', label: 'Green' },
  { id: 'blue', hex: '#2563eb', label: 'Blue' },
  { id: 'navy', hex: '#1e3a5f', label: 'Navy' },
  { id: 'rust', hex: '#8B4513', label: 'Rust' },
  { id: 'copper', hex: '#B87333', label: 'Copper' },
  { id: 'silver', hex: '#C0C0C0', label: 'Silver' },
]

interface ColorPickerProps {
  hasSelection: boolean
  onColorChange: (color: string) => void
}

export default function ColorPicker({ hasSelection, onColorChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#FFFFFF')

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={!hasSelection}
        title="Change Color"
        className={cn(
          'p-2 rounded-md transition-colors',
          !hasSelection
            ? 'text-stone-300 cursor-not-allowed'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        <Paintbrush className="w-4 h-4" />
      </button>

      {showPicker && hasSelection && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-white border border-stone-200 rounded-lg shadow-lg z-50 w-52">
          <p className="text-xs font-medium text-stone-500 mb-2">Fill Color</p>
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onColorChange(c.hex)
                  setShowPicker(false)
                }}
                title={c.label}
                className={cn(
                  'w-7 h-7 rounded-md transition-transform hover:scale-110',
                  c.border && 'border border-stone-300'
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <button
              onClick={() => {
                onColorChange(customColor)
                setShowPicker(false)
              }}
              className="flex-1 text-xs px-2 py-1.5 bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors"
            >
              Apply Custom
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
