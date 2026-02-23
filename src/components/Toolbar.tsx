'use client'

import { useRef } from 'react'
import {
  Trash2,
  Copy,
  FlipHorizontal,
  FlipVertical,
  ArrowUp,
  ArrowDown,
  RotateCw,
  RotateCcw,
  Undo2,
  Redo2,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import ColorPicker from './ColorPicker'

interface ToolbarProps {
  hasSelection: boolean
  onDelete: () => void
  onDuplicate: () => void
  onFlipH: () => void
  onFlipV: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onRotateCW: () => void
  onRotateCCW: () => void
  onUndo: () => void
  onRedo: () => void
  onColorChange: (color: string) => void
  onUploadImage: (file: File) => void
  canUndo: boolean
  canRedo: boolean
}

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

function ToolButton({ icon, label, onClick, disabled, danger }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'p-2 rounded-md transition-colors',
        disabled
          ? 'text-stone-300 cursor-not-allowed'
          : danger
            ? 'text-red-500 hover:bg-red-50 hover:text-red-600'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
      )}
    >
      {icon}
    </button>
  )
}

export default function Toolbar({
  hasSelection,
  onDelete,
  onDuplicate,
  onFlipH,
  onFlipV,
  onBringForward,
  onSendBackward,
  onRotateCW,
  onRotateCCW,
  onUndo,
  onRedo,
  onColorChange,
  onUploadImage,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white border border-stone-200 rounded-lg shadow-sm">
      <ToolButton icon={<Undo2 className="w-4 h-4" />} label="Undo" onClick={onUndo} disabled={!canUndo} />
      <ToolButton icon={<Redo2 className="w-4 h-4" />} label="Redo" onClick={onRedo} disabled={!canRedo} />

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <ToolButton icon={<RotateCcw className="w-4 h-4" />} label="Rotate Left" onClick={onRotateCCW} disabled={!hasSelection} />
      <ToolButton icon={<RotateCw className="w-4 h-4" />} label="Rotate Right" onClick={onRotateCW} disabled={!hasSelection} />
      <ToolButton icon={<FlipHorizontal className="w-4 h-4" />} label="Flip Horizontal" onClick={onFlipH} disabled={!hasSelection} />
      <ToolButton icon={<FlipVertical className="w-4 h-4" />} label="Flip Vertical" onClick={onFlipV} disabled={!hasSelection} />

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <ColorPicker hasSelection={hasSelection} onColorChange={onColorChange} />

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <ToolButton icon={<ArrowUp className="w-4 h-4" />} label="Bring Forward" onClick={onBringForward} disabled={!hasSelection} />
      <ToolButton icon={<ArrowDown className="w-4 h-4" />} label="Send Backward" onClick={onSendBackward} disabled={!hasSelection} />

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <ToolButton
        icon={<Upload className="w-4 h-4" />}
        label="Upload Image (SVG, PNG, JPG)"
        onClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onUploadImage(file)
            e.target.value = ''
          }
        }}
      />

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <ToolButton icon={<Copy className="w-4 h-4" />} label="Duplicate" onClick={onDuplicate} disabled={!hasSelection} />
      <ToolButton icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={onDelete} disabled={!hasSelection} danger />
    </div>
  )
}
