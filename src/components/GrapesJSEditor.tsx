import React, { useEffect, useRef, useState } from 'react'
import type { GrapesBlockDefinition, GrapesEditor } from '../types/grapes'
import { ensureGrapesJS } from '../utils/grapesLoader'

type GrapesDocument = {
  html: string
  css: string
}

type GrapesJSEditorProps = {
  initialHtml: string
  initialCss: string
  blocks?: GrapesBlockDefinition[]
  onChange?: (document: GrapesDocument) => void
  onEditorReady?: (editor: GrapesEditor) => void
  height?: string
  className?: string
}

const DEFAULT_DEVICES = [
  { name: 'Desktop', width: '' },
  { name: 'Tablet', width: '768px' },
  { name: 'Mobile', width: '375px' },
]

const GrapesJSEditor: React.FC<GrapesJSEditorProps> = ({
  initialHtml,
  initialCss,
  blocks,
  onChange,
  onEditorReady,
  height = '100%',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<GrapesEditor | null>(null)
  const changeHandlerRef = useRef(onChange)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    changeHandlerRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false
    let editorInstance: GrapesEditor | null = null

    const initialise = async () => {
      if (!containerRef.current) {
        return
      }

      try {
        const grapes = await ensureGrapesJS()
        if (cancelled || !containerRef.current) {
          return
        }

        editorInstance = grapes.init({
          container: containerRef.current,
          height,
          width: 'auto',
          fromElement: false,
          storageManager: { type: null },
          deviceManager: {
            devices: DEFAULT_DEVICES,
          },
        })

        editorRef.current = editorInstance
        editorInstance.setComponents(initialHtml)
        editorInstance.setStyle(initialCss)

        if (blocks && blocks.length > 0) {
          blocks.forEach(block => {
            if (!editorInstance!.BlockManager.get(block.id)) {
              editorInstance!.BlockManager.add(block.id, {
                label: block.label,
                content: block.content,
                category: block.category,
                media: block.media,
              })
            }
          })
        }

        onEditorReady?.(editorInstance)

        const handleUpdate = () => {
          const handler = changeHandlerRef.current
          if (!handler) {
            return
          }
          handler({
            html: editorInstance!.getHtml(),
            css: editorInstance!.getCss(),
          })
        }

        editorInstance.on('update', handleUpdate)
        handleUpdate()
      } catch (err) {
        console.error('Failed to initialise GrapesJS', err)
        setError(err instanceof Error ? err.message : 'Failed to load editor')
      }
    }

    void initialise()

    return () => {
      cancelled = true
      if (editorInstance) {
        editorInstance.destroy()
      } else if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !blocks || blocks.length === 0) {
      return
    }

    blocks.forEach(block => {
      if (!editor.BlockManager.get(block.id)) {
        editor.BlockManager.add(block.id, {
          label: block.label,
          content: block.content,
          category: block.category,
          media: block.media,
        })
      }
    })
  }, [blocks])

  if (error) {
    return (
      <div
        className={`flex h-full items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 p-6 text-sm text-red-600 ${
          className ?? ''
        }`}
      >
        {error}
      </div>
    )
  }

  return <div ref={containerRef} className={className} style={{ height, width: '100%' }} />
}

export default GrapesJSEditor
