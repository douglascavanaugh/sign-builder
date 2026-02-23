'use client'

import { SIGN_TEMPLATES, type SignTemplate } from '@/lib/sign-templates'
import { cn } from '@/lib/cn'
import { RectangleHorizontal } from 'lucide-react'

interface SignTemplatePickerProps {
  selected: SignTemplate
  onSelect: (template: SignTemplate) => void
}

export default function SignTemplatePicker({ selected, onSelect }: SignTemplatePickerProps) {
  return (
    <div className="flex flex-col border-b border-stone-200 max-h-52">
      <div className="flex items-center gap-2 text-stone-600 px-3 pt-3 pb-2 flex-shrink-0">
        <RectangleHorizontal className="w-4 h-4" />
        <span className="text-sm font-medium">Sign Size</span>
        <span className="text-xs text-stone-400">({SIGN_TEMPLATES.length})</span>
      </div>
      <div className="overflow-y-auto px-3 pb-3 scrollbar-thin">
        <div className="grid grid-cols-2 gap-1.5">
          {SIGN_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={cn(
                'text-left px-2.5 py-1.5 rounded-md text-xs transition-colors border',
                selected.id === t.id
                  ? 'bg-brand-50 border-brand-400 text-brand-800 font-semibold'
                  : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
