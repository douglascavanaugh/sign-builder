'use client'

import { useState, useRef, useCallback } from 'react'
import { Download, ShoppingCart, Eraser, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

import SignTemplatePicker from '@/components/SignTemplatePicker'
import SvgLibrary from '@/components/SvgLibrary'
import TextTool from '@/components/TextTool'
import Toolbar from '@/components/Toolbar'
import { SIGN_TEMPLATES, templateToCanvasSize } from '@/lib/sign-templates'
import type { SignCanvasHandle } from '@/components/SignCanvas'
import { cn } from '@/lib/cn'

const SignCanvas = dynamic(() => import('@/components/SignCanvas'), { ssr: false })

export default function BuilderPage() {
  const [template, setTemplate] = useState(SIGN_TEMPLATES.find((t) => t.id === '18x24') || SIGN_TEMPLATES[0])
  const [hasSelection, setHasSelection] = useState(false)
  const [productCode, setProductCode] = useState('')
  const [zoom, setZoom] = useState(1)
  const [undoStack] = useState<string[]>([])
  const [redoStack] = useState<string[]>([])
  const canvasHandleRef = useRef<SignCanvasHandle | null>(null)

  const handleCanvasReady = useCallback((handle: SignCanvasHandle) => {
    canvasHandleRef.current = handle
  }, [])

  const canvasSize = templateToCanvasSize(template)

  const handleAddSvg = useCallback(async (svgUrl: string, assetId?: string) => {
    if (assetId) setProductCode(assetId)

    const canvas = canvasHandleRef.current?.getCanvas()
    if (!canvas) return

    try {
      const fabric = await import('fabric')
      const response = await fetch(svgUrl)
      const svgText = await response.text()
      const result = await fabric.loadSVGFromString(svgText)
      const paths = result.objects.filter(Boolean) as fabric.FabricObject[]

      paths.forEach((p) => {
        if (!p.fill || p.fill === 'none' || p.fill === 'transparent' || p.fill === '') {
          p.set('fill', '#1c1917')
        }
      })

      const group = new fabric.Group(paths)
      const maxDim = Math.min(canvas.width! * 0.3, canvas.height! * 0.3)
      const scale = Math.min(maxDim / (group.width || 100), maxDim / (group.height || 100))

      group.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
      })

      canvas.add(group)
      canvas.setActiveObject(group)
      canvas.renderAll()
    } catch (err) {
      console.error('Error adding SVG:', err)
      toast.error('Failed to add design element')
    }
  }, [])

  const handleUploadImage = useCallback(async (file: File) => {
    const canvas = canvasHandleRef.current?.getCanvas()
    if (!canvas) return

    try {
      const fabric = await import('fabric')
      const url = URL.createObjectURL(file)
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')

      if (isSvg) {
        const svgText = await file.text()
        const result = await fabric.loadSVGFromString(svgText)
        const paths = result.objects.filter(Boolean) as fabric.FabricObject[]

        paths.forEach((p) => {
          if (!p.fill || p.fill === 'none' || p.fill === 'transparent' || p.fill === '') {
            p.set('fill', '#1c1917')
          }
        })

        const group = new fabric.Group(paths)
        const maxDim = Math.min(canvas.width! * 0.3, canvas.height! * 0.3)
        const scale = Math.min(maxDim / (group.width || 100), maxDim / (group.height || 100))

        group.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        })

        canvas.add(group)
        canvas.setActiveObject(group)
        canvas.renderAll()
      } else {
        const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
        const maxDim = Math.min(canvas.width! * 0.3, canvas.height! * 0.3)
        const scale = Math.min(maxDim / (img.width || 100), maxDim / (img.height || 100))

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
        })

        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      }

      toast.success(`Added "${file.name}" to your sign`)
    } catch (err) {
      console.error('Error uploading image:', err)
      toast.error('Failed to add uploaded image')
    }
  }, [])

  const handleAddText = useCallback(async (text: string, fontFamily: string, fontSize: number) => {
    const canvas = canvasHandleRef.current?.getCanvas()
    if (!canvas) return

    const fabric = await import('fabric')
    const textObj = new fabric.IText(text, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      fontFamily,
      fontSize,
      fill: '#1c1917',
      editable: true,
    })

    canvas.add(textObj)
    canvas.setActiveObject(textObj)
    canvas.renderAll()
  }, [])

  const getActiveObject = useCallback(() => {
    return canvasHandleRef.current?.getCanvas()?.getActiveObject() ?? null
  }, [])

  const handleDelete = useCallback(() => {
    const canvas = canvasHandleRef.current?.getCanvas()
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return
    canvas.remove(obj)
    canvas.discardActiveObject()
    canvas.renderAll()
  }, [])

  const handleDuplicate = useCallback(async () => {
    const canvas = canvasHandleRef.current?.getCanvas()
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return

    const cloned = await obj.clone()
    cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 })
    canvas.add(cloned)
    canvas.setActiveObject(cloned)
    canvas.renderAll()
  }, [])

  const handleFlipH = useCallback(() => {
    const obj = getActiveObject()
    if (!obj) return
    obj.set('flipX', !obj.flipX)
    canvasHandleRef.current?.getCanvas()?.renderAll()
  }, [getActiveObject])

  const handleFlipV = useCallback(() => {
    const obj = getActiveObject()
    if (!obj) return
    obj.set('flipY', !obj.flipY)
    canvasHandleRef.current?.getCanvas()?.renderAll()
  }, [getActiveObject])

  const handleBringForward = useCallback(() => {
    const canvas = canvasHandleRef.current?.getCanvas()
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return
    canvas.bringObjectForward(obj)
    canvas.renderAll()
  }, [])

  const handleSendBackward = useCallback(() => {
    const canvas = canvasHandleRef.current?.getCanvas()
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return
    canvas.sendObjectBackwards(obj)
    canvas.renderAll()
  }, [])

  const handleRotateCW = useCallback(() => {
    const obj = getActiveObject()
    if (!obj) return
    obj.rotate((obj.angle || 0) + 15)
    canvasHandleRef.current?.getCanvas()?.renderAll()
  }, [getActiveObject])

  const handleRotateCCW = useCallback(() => {
    const obj = getActiveObject()
    if (!obj) return
    obj.rotate((obj.angle || 0) - 15)
    canvasHandleRef.current?.getCanvas()?.renderAll()
  }, [getActiveObject])

  const handleColorChange = useCallback((color: string) => {
    const canvas = canvasHandleRef.current?.getCanvas()
    const obj = canvas?.getActiveObject()
    if (!canvas || !obj) return

    if ('_objects' in obj && Array.isArray((obj as any)._objects)) {
      (obj as any)._objects.forEach((child: any) => {
        if (child.fill !== 'transparent' && child.fill !== 'none' && child.fill !== '') {
          child.set('fill', color)
        }
        if (child.stroke && child.stroke !== 'none' && child.stroke !== 'transparent') {
          child.set('stroke', color)
        }
      })
    } else {
      if (obj.fill !== 'transparent' && obj.fill !== 'none') {
        obj.set('fill', color)
      }
      if ((obj as any).stroke && (obj as any).stroke !== 'none') {
        obj.set('stroke' as any, color)
      }
    }

    canvas.renderAll()
  }, [])

  const handleClear = useCallback(() => {
    canvasHandleRef.current?.clearCanvas()
    toast.success('Canvas cleared')
  }, [])

  const getFilename = useCallback(() => {
    const code = productCode.trim().replace(/\s+/g, '-') || 'custom-sign'
    return `${code}-${template.id}`
  }, [productCode, template.id])

  const handleExportPNG = useCallback(() => {
    const dataUrl = canvasHandleRef.current?.exportPNG()
    if (!dataUrl) return

    const link = document.createElement('a')
    link.download = `${getFilename()}.png`
    link.href = dataUrl
    link.click()
    toast.success('Design downloaded!')
  }, [getFilename])

  const handleAddToCart = useCallback(() => {
    const png = canvasHandleRef.current?.exportPNG()
    const json = canvasHandleRef.current?.exportJSON()
    if (!png || !json) {
      toast.error('Please add some elements to your sign first')
      return
    }

    console.log('Design ready for cart:', {
      productCode: productCode.trim() || undefined,
      template: template.id,
      templateName: template.name,
      filename: getFilename(),
      png: png.substring(0, 50) + '...',
      config: JSON.parse(json),
    })

    toast.success('Design saved! Cart integration coming soon.')
  }, [template, productCode, getFilename])

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-brand-500" />
          <h1 className="text-lg font-bold text-stone-800">Custom Sign Builder</h1>
          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">by AllwayzMags</span>
        </div>
        <div className="flex items-center gap-2">
          {productCode && (
            <>
              <span className="px-3 py-1.5 text-sm font-medium text-stone-700 bg-stone-100 rounded-md">
                {productCode}
              </span>
              <div className="w-px h-6 bg-stone-200" />
            </>
          )}
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
          >
            <Eraser className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-700 text-white hover:bg-stone-800 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            onClick={handleAddToCart}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md transition-colors font-medium',
              'bg-brand-500 text-white hover:bg-brand-600'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-white border-r border-stone-200 overflow-y-auto scrollbar-thin">
          <SignTemplatePicker selected={template} onSelect={setTemplate} />
          <SvgLibrary onAddToCanvas={handleAddSvg} />
          <TextTool onAddText={handleAddText} />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto relative bg-stone-200">
            <div className="sticky top-0 z-10 px-4 py-2 flex justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <Toolbar
                  hasSelection={hasSelection}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onFlipH={handleFlipH}
                  onFlipV={handleFlipV}
                  onBringForward={handleBringForward}
                  onSendBackward={handleSendBackward}
                  onRotateCW={handleRotateCW}
                  onRotateCCW={handleRotateCCW}
                  onColorChange={handleColorChange}
                  onUploadImage={handleUploadImage}
                  onUndo={() => {}}
                  onRedo={() => {}}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                />
              </div>
            </div>
            <div className="flex items-start justify-center px-6 pb-6 pt-[100px]">
              <SignCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                zoom={zoom}
                onSelectionChange={setHasSelection}
                onReady={handleCanvasReady}
              />
            </div>
            <div className="sticky bottom-3 right-3 flex justify-end pr-3 pointer-events-none">
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg shadow-sm px-2 py-1 pointer-events-auto">
                <button
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
                  title="Zoom Out"
                  className="p-1.5 rounded text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  title="Reset Zoom"
                  className="px-2 py-1 rounded text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors min-w-[3rem] text-center"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  title="Zoom In"
                  className="p-1.5 rounded text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-stone-200 mx-0.5" />
                <button
                  onClick={() => {
                    const container = document.querySelector('main .overflow-auto')
                    if (!container) return
                    const available = container.clientWidth - 48
                    const canvasW = canvasSize.width * 2.5
                    setZoom(Math.min(1, available / canvasW))
                  }}
                  title="Fit to Width"
                  className="p-1.5 rounded text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 text-center text-xs text-stone-400 flex-shrink-0">
            {template.name} ({template.widthInches}&quot; x {template.heightInches}&quot;)
            &nbsp;&bull;&nbsp; Click designs to add &nbsp;&bull;&nbsp; Double-click text to edit
            &nbsp;&bull;&nbsp; Upload your own images
          </div>
        </main>
      </div>
    </div>
  )
}
