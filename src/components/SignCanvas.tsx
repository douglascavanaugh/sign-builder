'use client'

import { useEffect, useRef } from 'react'
import type { Canvas as FabricCanvas, Rect as FabricRect } from 'fabric'

export interface SignCanvasHandle {
  getCanvas: () => FabricCanvas | null
  exportPNG: () => string | null
  exportJSON: () => string | null
  clearCanvas: () => void
}

interface SignCanvasProps {
  width: number
  height: number
  zoom: number
  onSelectionChange?: (hasSelection: boolean) => void
  onReady?: (handle: SignCanvasHandle) => void
}

const CANVAS_SCALE = 2.5

export default function SignCanvas({ width, height, zoom, onSelectionChange, onReady }: SignCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const borderRef = useRef<FabricRect | null>(null)
  const callbacksRef = useRef({ onSelectionChange, onReady })
  callbacksRef.current = { onSelectionChange, onReady }

  const scaledWidth = width * CANVAS_SCALE
  const scaledHeight = height * CANVAS_SCALE

  useEffect(() => {
    if (!canvasElRef.current) return

    const initCanvas = async () => {
      const fabric = await import('fabric')

      const canvas = new fabric.Canvas(canvasElRef.current!, {
        width: scaledWidth,
        height: scaledHeight,
        backgroundColor: '#FFFFFF',
        selection: true,
        preserveObjectStacking: true,
      })

      canvas.on('selection:created', () => callbacksRef.current.onSelectionChange?.(true))
      canvas.on('selection:updated', () => callbacksRef.current.onSelectionChange?.(true))
      canvas.on('selection:cleared', () => callbacksRef.current.onSelectionChange?.(false))

      const border = new fabric.Rect({
        left: 0,
        top: 0,
        width: scaledWidth,
        height: scaledHeight,
        fill: 'transparent',
        stroke: '#78716c',
        strokeWidth: 3,
        selectable: false,
        evented: false,
        strokeUniform: true,
      })
      canvas.add(border)
      canvas.sendObjectToBack(border)

      fabricRef.current = canvas
      borderRef.current = border

      callbacksRef.current.onReady?.({
        getCanvas: () => fabricRef.current,
        exportPNG: () => {
          if (!fabricRef.current) return null
          return fabricRef.current.toDataURL({ format: 'png', multiplier: 2 })
        },
        exportJSON: () => {
          if (!fabricRef.current) return null
          return JSON.stringify(fabricRef.current.toJSON())
        },
        clearCanvas: () => {
          if (!fabricRef.current) return
          const objs = fabricRef.current.getObjects().filter((o) => o !== borderRef.current)
          objs.forEach((o) => fabricRef.current!.remove(o))
          fabricRef.current.discardActiveObject()
          fabricRef.current.renderAll()
        },
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return

      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return

      const canvas = fabricRef.current
      if (!canvas) return

      const active = canvas.getActiveObject()
      if (!active) return

      if ((active as any).isEditing) return

      e.preventDefault()
      canvas.remove(active)
      canvas.discardActiveObject()
      canvas.renderAll()
      callbacksRef.current.onSelectionChange?.(false)
    }

    document.addEventListener('keydown', handleKeyDown)

    initCanvas()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      fabricRef.current?.dispose()
      fabricRef.current = null
      borderRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const canvas = fabricRef.current
    const border = borderRef.current
    if (!canvas || !border) return

    canvas.setDimensions({ width: scaledWidth, height: scaledHeight })
    border.set({ width: scaledWidth, height: scaledHeight })
    border.setCoords()
    canvas.renderAll()
  }, [scaledWidth, scaledHeight])

  return (
    <div
      className="shadow-2xl flex-shrink-0"
      style={{
        width: scaledWidth,
        height: scaledHeight,
        transform: `scale(${zoom})`,
        transformOrigin: 'center center',
      }}
    >
      <canvas ref={canvasElRef} />
    </div>
  )
}
