'use client'

import { useState } from 'react'
import { Type, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

const FONTS = [
  { id: 'serif', label: 'Classic Serif', family: 'Georgia, serif' },
  { id: 'sans', label: 'Clean Sans', family: 'Arial, Helvetica, sans-serif' },
  { id: 'western', label: 'Western', family: '"Courier New", Courier, monospace' },
  { id: 'script', label: 'Script', family: '"Brush Script MT", cursive' },
  { id: 'block', label: 'Block', family: 'Impact, "Arial Black", sans-serif' },
]

interface TextToolProps {
  onAddText: (text: string, fontFamily: string, fontSize: number) => void
}

export default function TextTool({ onAddText }: TextToolProps) {
  const [text, setText] = useState('')
  const [selectedFont, setSelectedFont] = useState(FONTS[0])
  const [fontSize, setFontSize] = useState(32)

  const handleAdd = () => {
    if (!text.trim()) return
    onAddText(text.trim(), selectedFont.family, fontSize)
    setText('')
  }

  return (
    <div className="p-3 space-y-3 border-t border-stone-200">
      <div className="flex items-center gap-2 text-stone-600">
        <Type className="w-4 h-4" />
        <span className="text-sm font-medium">Add Text</span>
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="Ranch name, address, etc."
        className="w-full px-3 py-2 text-sm bg-stone-100 border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="space-y-1.5">
        <label className="text-xs text-stone-500">Font</label>
        <div className="grid grid-cols-1 gap-1">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => setSelectedFont(font)}
              className={cn(
                'text-left px-2 py-1.5 rounded text-sm transition-colors',
                selectedFont.id === font.id
                  ? 'bg-brand-100 text-brand-800 border border-brand-300'
                  : 'bg-stone-50 hover:bg-stone-100 border border-transparent'
              )}
              style={{ fontFamily: font.family }}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-stone-500">Size: {fontSize}px</label>
        <input
          type="range"
          min={12}
          max={80}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          text.trim()
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        )}
      >
        <Plus className="w-4 h-4" />
        Add to Sign
      </button>
    </div>
  )
}
