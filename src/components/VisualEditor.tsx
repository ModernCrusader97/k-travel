import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Transform helpers ────────────────────────────────────────────

interface TF { tx: number; ty: number; rot: number; scale: number }

function parseTF(t: string): TF {
  const tx  = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
  const rot = t.match(/rotate\(([-\d.]+)deg\)/)
  const sc  = t.match(/scale\(([-\d.]+)\)/)
  return {
    tx:    tx  ? parseFloat(tx[1])  : 0,
    ty:    tx  ? parseFloat(tx[2])  : 0,
    rot:   rot ? parseFloat(rot[1]) : 0,
    scale: sc  ? parseFloat(sc[1])  : 1,
  }
}

function buildTF({ tx, ty, rot, scale }: TF): string {
  const parts: string[] = []
  if (tx !== 0 || ty !== 0) parts.push(`translate(${tx.toFixed(0)}px,${ty.toFixed(0)}px)`)
  if (rot !== 0)             parts.push(`rotate(${rot.toFixed(1)}deg)`)
  if (Math.abs(scale - 1) > 0.001) parts.push(`scale(${scale.toFixed(3)})`)
  return parts.join(' ')
}

function isCard(el: HTMLElement) { return el.classList.contains('fan-card') }

function rgbToHex(rgb: string): string {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#ffffff'
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3) return '#000000'
  return '#' + m.slice(0, 3).map((x: string) => parseInt(x).toString(16).padStart(2, '0')).join('')
}

// ─── Handle layout ────────────────────────────────────────────────

type HandleDir = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'

const HANDLES: { dir: HandleDir; cls: string }[] = [
  { dir: 'nw', cls: 've-h-nw' }, { dir: 'n',  cls: 've-h-n'  }, { dir: 'ne', cls: 've-h-ne' },
  { dir: 'e',  cls: 've-h-e'  }, { dir: 'se', cls: 've-h-se' }, { dir: 's',  cls: 've-h-s'  },
  { dir: 'sw', cls: 've-h-sw' }, { dir: 'w',  cls: 've-h-w'  },
]

interface DragState {
  type: 'move' | 'resize' | 'rotate'
  dir?: HandleDir
  startX: number; startY: number
  startLeft: number; startBottom: number; parentWidth: number; parentHeight: number
  startTF: TF
  natW: number; natH: number
  cx: number; cy: number
}

// ─── Component ────────────────────────────────────────────────────

export default function VisualEditor() {
  const [active, setActive]         = useState(false)
  const [sel, setSel]               = useState<HTMLElement | null>(null)
  const [box, setBox]               = useState<DOMRect | null>(null)
  const [rotAngle, setRotAngle]     = useState(0)
  const [hasChanges, setHasChanges] = useState(false)
  const [canUndo, setCanUndo]       = useState(false)
  const [sending, setSending]       = useState(false)
  const [sent, setSent]             = useState(false)
  const [textEditing, setTextEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewW, setPreviewW]     = useState(375)
  const [previewH, setPreviewH]     = useState(812)

  // Style panel state
  const [styleColor, setStyleColor]         = useState('#000000')
  const [styleBg, setStyleBg]               = useState('#ffffff')
  const [styleFontSize, setStyleFontSize]   = useState<number | ''>(16)
  const [styleOpacity, setStyleOpacity]     = useState(100)

  // Position state
  const [posX, setPosX] = useState<number>(0)
  const [posY, setPosY] = useState<number>(0)

  const changes    = useRef<Record<string, string>>({})
  const drag       = useRef<DragState | null>(null)
  const selRef     = useRef<HTMLElement | null>(null)
  const history    = useRef<Array<{ el: HTMLElement; cssText: string; transform: string; left: string; bottom: string }>>([])
  const textEditEl = useRef<HTMLElement | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  selRef.current = sel

  const syncBox = useCallback((el: HTMLElement) => {
    setBox(el.getBoundingClientRect())
    const tf = parseTF(el.style.transform || '')
    setRotAngle(tf.rot)
    if (isCard(el)) {
      setPosX(Math.round(parseFloat(el.style.left) || 0))
      setPosY(Math.round(parseFloat(el.style.bottom) || 0))
    } else {
      setPosX(Math.round(tf.tx))
      setPosY(Math.round(tf.ty))
    }
  }, [])

  const syncStylePanel = useCallback((el: HTMLElement) => {
    const cs = window.getComputedStyle(el)
    setStyleColor(rgbToHex(cs.color))
    setStyleBg(rgbToHex(cs.backgroundColor))
    const fs = parseFloat(cs.fontSize)
    setStyleFontSize(isNaN(fs) ? '' : Math.round(fs))
    setStyleOpacity(Math.round(parseFloat(cs.opacity || '1') * 100))
  }, [])

  const pushHistory = useCallback((el: HTMLElement) => {
    history.current.push({
      el,
      cssText: el.style.cssText,
      transform: el.style.transform,
      left: el.style.left,
      bottom: el.style.bottom,
    })
    if (history.current.length > 50) history.current.shift()
    setCanUndo(true)
  }, [])

  const stopTextEdit = useCallback(() => {
    if (!textEditEl.current) return
    const el = textEditEl.current
    el.contentEditable = 'false'
    el.style.outline = ''
    const label = el.dataset.edit
    if (label) {
      changes.current[label] = `text: ${el.innerHTML}`
      setHasChanges(true)
    }
    textEditEl.current = null
    setTextEditing(false)
    if (selRef.current) syncBox(selRef.current)
  }, [syncBox])

  const undo = useCallback(() => {
    const snap = history.current.pop()
    if (!snap) return
    snap.el.style.cssText = snap.cssText
    setCanUndo(history.current.length > 0)
    if (selRef.current === snap.el) { syncBox(snap.el); syncStylePanel(snap.el) }
  }, [syncBox, syncStylePanel])

  const duplicateEl = useCallback(() => {
    const el = selRef.current
    if (!el) return
    const clone = el.cloneNode(true) as HTMLElement
    const tf = parseTF(el.style.transform || '')
    tf.tx += 20; tf.ty += 20
    clone.style.transform = buildTF(tf)
    el.parentElement?.appendChild(clone)
    setSel(clone)
    syncBox(clone)
    syncStylePanel(clone)
    setHasChanges(true)
  }, [syncBox, syncStylePanel])

  // Activate / deactivate
  useEffect(() => {
    document.body.classList.toggle('ve-active', active)
    if (!active) {
      setSel(null); setBox(null)
      changes.current = {}; setHasChanges(false)
      history.current = []; setCanUndo(false)
      stopTextEdit()
    }
  }, [active, stopTextEdit])

  // Keyboard shortcuts
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateEl() }
      if (e.key === 'Escape') stopTextEdit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, undo, duplicateEl, stopTextEdit])

  // Click to select element
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('[data-ve-handle]')) return
      if ((e.target as Element).closest('.ve-overlay')) return
      if ((e.target as Element).closest('.ve-style-panel')) return
      if (textEditEl.current?.contains(e.target as Node)) return

      stopTextEdit()

      const target = (e.target as Element).closest('[data-edit]') as HTMLElement | null
      if (!target) { setSel(null); setBox(null); return }
      setSel(target)
      syncBox(target)
      syncStylePanel(target)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [active, syncBox, syncStylePanel, stopTextEdit])

  // Double-click to edit text
  useEffect(() => {
    if (!active) return
    const onDbl = (e: MouseEvent) => {
      if ((e.target as Element).closest('[data-ve-handle]')) return
      const target = (e.target as Element).closest('[data-edit]') as HTMLElement | null
      if (!target || target.dataset.editType !== 'text') return
      e.preventDefault()
      stopTextEdit()
      pushHistory(target)
      target.contentEditable = 'true'
      target.style.outline = '2px dashed #F5C300'
      textEditEl.current = target
      setSel(target)
      syncBox(target)
      setTextEditing(true)
      const range = document.createRange()
      range.selectNodeContents(target)
      range.collapse(false)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
    }
    document.addEventListener('dblclick', onDbl)
    return () => document.removeEventListener('dblclick', onDbl)
  }, [active, pushHistory, stopTextEdit, syncBox])

  // Global drag handling
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      const el = selRef.current
      if (!d || !el || e.buttons === 0) return

      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      const label = el.dataset.edit || ''
      const tf = { ...d.startTF }

      if (d.type === 'move') {
        if (isCard(el)) {
          const newLeft = d.startLeft + (dx / d.parentWidth) * 100
          const newBottom = d.startBottom - dy
          el.style.left = `${newLeft.toFixed(1)}%`
          el.style.bottom = `${newBottom.toFixed(0)}px`
          changes.current[label] = `left: ${newLeft.toFixed(1)}%, bottom: ${newBottom.toFixed(0)}px, rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        } else {
          tf.tx = d.startTF.tx + dx
          tf.ty = d.startTF.ty + dy
          el.style.transform = buildTF(tf)
          changes.current[label] = `translate(${tf.tx.toFixed(0)}px,${tf.ty.toFixed(0)}px), rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        }
      } else if (d.type === 'rotate') {
        const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * (180 / Math.PI) + 90
        tf.rot = angle
        el.style.transform = buildTF(tf)
        if (isCard(el)) {
          changes.current[label] = `left: ${d.startLeft.toFixed(1)}%, bottom: ${d.startBottom.toFixed(0)}px, rotate: ${angle.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        } else {
          changes.current[label] = `translate(${tf.tx.toFixed(0)}px,${tf.ty.toFixed(0)}px), rotate: ${angle.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        }
      } else {
        const dir = d.dir!
        let delta = 0
        if      (dir === 'se') delta = (dx + dy)   / (d.natW + d.natH)
        else if (dir === 'sw') delta = (-dx + dy)   / (d.natW + d.natH)
        else if (dir === 'ne') delta = (dx - dy)    / (d.natW + d.natH)
        else if (dir === 'nw') delta = (-dx - dy)   / (d.natW + d.natH)
        else if (dir === 'e')  delta = dx  / d.natW
        else if (dir === 'w')  delta = -dx / d.natW
        else if (dir === 's')  delta = dy  / d.natH
        else if (dir === 'n')  delta = -dy / d.natH
        tf.scale = Math.max(0.1, d.startTF.scale + delta * d.startTF.scale)
        el.style.transform = buildTF(tf)
        if (isCard(el)) {
          changes.current[label] = `left: ${d.startLeft.toFixed(1)}%, bottom: ${d.startBottom.toFixed(0)}px, rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        } else {
          changes.current[label] = `translate(${tf.tx.toFixed(0)}px,${tf.ty.toFixed(0)}px), rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
        }
      }

      setHasChanges(true)
      syncBox(el)
    }

    const onUp = () => { drag.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [syncBox])

  const startDrag = (e: React.PointerEvent, type: DragState['type'], dir?: HandleDir) => {
    const el = sel
    if (!el || textEditing) return
    e.preventDefault(); e.stopPropagation()
    pushHistory(el)

    const rect = el.getBoundingClientRect()
    const tf = parseTF(el.style.transform || '')
    const cx = (rect.left + rect.right) / 2
    const cy = isCard(el) ? rect.bottom : (rect.top + rect.bottom) / 2
    const parentEl = el.parentElement
    const computedBottom = parseFloat(el.style.bottom) || (parentEl ? parentEl.offsetHeight - rect.bottom + window.scrollY : 40)

    drag.current = {
      type, dir,
      startX: e.clientX, startY: e.clientY,
      startLeft: parseFloat(el.style.left) || 0,
      startBottom: computedBottom,
      parentWidth: parentEl?.offsetWidth || 1,
      parentHeight: parentEl?.offsetHeight || 1,
      startTF: { ...tf },
      natW: el.offsetWidth, natH: el.offsetHeight,
      cx, cy,
    }
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  // Style panel apply
  const applyStyle = (prop: string, value: string) => {
    const el = selRef.current
    if (!el) return
    pushHistory(el)
    ;(el.style as any)[prop] = value
    setHasChanges(true)
    const label = el.dataset.edit || ''
    changes.current[label] = (changes.current[label] || '') + ` | ${prop}: ${value}`
  }

  // Position apply
  const applyPos = (axis: 'x' | 'y', value: number) => {
    const el = selRef.current
    if (!el) return
    pushHistory(el)
    const label = el.dataset.edit || ''
    const tf = parseTF(el.style.transform || '')
    if (isCard(el)) {
      if (axis === 'x') {
        const parentW = el.parentElement?.offsetWidth || 1
        const pct = (value / parentW) * 100
        el.style.left = `${pct.toFixed(1)}%`
        setPosX(value)
        changes.current[label] = `left: ${pct.toFixed(1)}%, bottom: ${parseFloat(el.style.bottom) || 0}px, rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
      } else {
        el.style.bottom = `${value}px`
        setPosY(value)
        changes.current[label] = `left: ${el.style.left}, bottom: ${value}px, rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
      }
    } else {
      if (axis === 'x') { tf.tx = value; setPosX(value) }
      else               { tf.ty = value; setPosY(value) }
      el.style.transform = buildTF(tf)
      changes.current[label] = `translate(${tf.tx.toFixed(0)}px,${tf.ty.toFixed(0)}px), rotate: ${tf.rot.toFixed(1)}deg, scale: ${tf.scale.toFixed(3)}`
    }
    setHasChanges(true)
    syncBox(el)
  }

  // Image upload
  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const el = selRef.current
    if (!file || !el) return
    e.target.value = ''
    pushHistory(el)
    const form = new FormData()
    form.append('image', file)
    try {
      const r = await fetch('/page-maker/upload-image', { method: 'POST', body: form })
      const d = await r.json()
      if (!d.ok) return
      if (el.tagName === 'IMG') {
        (el as HTMLImageElement).src = d.url
      } else {
        el.style.backgroundImage = `url('${d.url}')`
        el.style.backgroundSize = 'cover'
        el.style.backgroundPosition = 'center'
      }
      changes.current[el.dataset.edit || ''] = `image: ${d.url}`
      setHasChanges(true)
      syncBox(el)
    } catch {}
  }

  const sendChanges = async () => {
    if (!hasChanges) return
    setSending(true)
    try {
      await fetch('/api/send-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: changes.current }),
      })
      setSent(true); setTimeout(() => setSent(false), 3000)
      changes.current = {}; setHasChanges(false)
    } catch { alert('전송 실패') } finally { setSending(false) }
  }

  const applyChanges = async () => {
    if (!hasChanges) return
    setSending(true)
    try {
      await fetch('/api/apply-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: changes.current }),
      })
      setSent(true); setTimeout(() => setSent(false), 3000)
      changes.current = {}; setHasChanges(false)
    } catch { alert('적용 실패') } finally { setSending(false) }
  }

  const selType = sel?.dataset.editType

  return (
    <>
      {/* Selection + drag overlay */}
      {active && sel && box && (
        <div
          className="ve-overlay"
          style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          onPointerDown={e => !textEditing && startDrag(e, 'move')}
        >
          {!textEditing && HANDLES.map(({ dir, cls }) => (
            <div key={dir} className={`ve-handle ${cls}`} data-ve-handle={dir}
              onPointerDown={e => startDrag(e, 'resize', dir)} />
          ))}
          {!textEditing && (
            <>
              <div className="ve-rotate-stem" />
              <div className="ve-rotate-handle" data-ve-handle="rotate"
                onPointerDown={e => startDrag(e, 'rotate', 'rotate' as any)}>↻</div>
            </>
          )}
          <div className="ve-angle-badge">{rotAngle.toFixed(1)}°</div>
        </div>
      )}

      {/* Style panel */}
      {active && sel && (
        <div className="ve-style-panel">
          <div className="vsp-title">위치</div>
          <div className="vsp-row">
            <label>{isCard(sel) ? 'Left' : 'X'}</label>
            <input type="number" className="vsp-num" style={{ width: 64 }} value={posX}
              onChange={e => applyPos('x', parseInt(e.target.value) || 0)} />
            <span className="vsp-unit">{isCard(sel) ? 'px→%' : 'px'}</span>
          </div>
          <div className="vsp-row">
            <label>{isCard(sel) ? 'Bottom' : 'Y'}</label>
            <input type="number" className="vsp-num" style={{ width: 64 }} value={posY}
              onChange={e => applyPos('y', parseInt(e.target.value) || 0)} />
            <span className="vsp-unit">px</span>
          </div>
          <div className="vsp-title" style={{ marginTop: 4 }}>스타일</div>
          {selType === 'text' && (
            <>
              <div className="vsp-row">
                <label>글자색</label>
                <input type="color" value={styleColor}
                  onChange={e => { setStyleColor(e.target.value); applyStyle('color', e.target.value) }} />
              </div>
              <div className="vsp-row">
                <label>폰트 크기</label>
                <input type="number" className="vsp-num" value={styleFontSize} min={6} max={200}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    if (v > 0) { setStyleFontSize(v); applyStyle('fontSize', v + 'px') }
                  }} />
                <span className="vsp-unit">px</span>
              </div>
            </>
          )}
          <div className="vsp-row">
            <label>배경색</label>
            <input type="color" value={styleBg === '#ffffff' ? '#ffffff' : styleBg}
              onChange={e => { setStyleBg(e.target.value); applyStyle('backgroundColor', e.target.value) }} />
            <button className="vsp-clear"
              onClick={() => { applyStyle('backgroundColor', 'transparent'); setStyleBg('#ffffff') }}>✕</button>
          </div>
          <div className="vsp-row">
            <label>투명도</label>
            <input type="range" className="vsp-range" min={0} max={100} value={styleOpacity}
              onChange={e => {
                const v = parseInt(e.target.value)
                setStyleOpacity(v); applyStyle('opacity', String(v / 100))
              }} />
            <span className="vsp-unit">{styleOpacity}%</span>
          </div>
          <div className="vsp-actions">
            {selType === 'image' && (
              <button className="vsp-btn" onClick={() => imgInputRef.current?.click()}>🖼 이미지 교체</button>
            )}
            <button className="vsp-btn" onClick={duplicateEl}>복제</button>
          </div>
        </div>
      )}

      {/* Hidden image file input */}
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageSelected} />

      {/* Preview modal */}
      {showPreview && (
        <div className="ve-preview-modal" onClick={e => { if (e.target === e.currentTarget) setShowPreview(false) }}>
          <div className="ve-preview-toolbar">
            <button className="vep-preset" onClick={() => { setPreviewW(375); setPreviewH(812) }}>📱 모바일</button>
            <button className="vep-preset" onClick={() => { setPreviewW(768); setPreviewH(1024) }}>📟 태블릿</button>
            <button className="vep-preset" onClick={() => { setPreviewW(1280); setPreviewH(800) }}>🖥 PC</button>
            <span className="vep-sep">|</span>
            <input type="number" className="vep-size" value={previewW}
              onChange={e => setPreviewW(parseInt(e.target.value) || 375)} />
            <span className="vep-x">×</span>
            <input type="number" className="vep-size" value={previewH}
              onChange={e => setPreviewH(parseInt(e.target.value) || 812)} />
            <button className="vep-close" onClick={() => setShowPreview(false)}>✕ 닫기</button>
          </div>
          <div className="ve-preview-wrap">
            <iframe src="/" width={previewW} height={previewH} style={{ border: 'none', display: 'block' }} title="preview" />
          </div>
        </div>
      )}

      {/* Bottom-right controls */}
      <div className="ve-root">
        {active && (
          <div className="ve-bar">
            <button className={`ve-btn ve-btn--undo ${!canUndo ? 've-btn--disabled' : ''}`}
              onClick={undo} disabled={!canUndo} title="Ctrl+Z">↩ 되돌리기</button>

            {selType === 'text' && !textEditing && (
              <button className="ve-btn ve-btn--text" onClick={() => {
                if (!sel) return
                stopTextEdit()
                pushHistory(sel)
                sel.contentEditable = 'true'
                sel.style.outline = '2px dashed #F5C300'
                textEditEl.current = sel
                setTextEditing(true)
                sel.focus()
              }}>✏ 텍스트 편집</button>
            )}
            {textEditing && (
              <button className="ve-btn ve-btn--text-done" onClick={stopTextEdit}>✓ 완료</button>
            )}
            {selType === 'image' && !textEditing && (
              <button className="ve-btn ve-btn--img" onClick={() => imgInputRef.current?.click()}>🖼 교체</button>
            )}

            <button className="ve-btn ve-btn--preview" onClick={() => setShowPreview(true)}>📱 프리뷰</button>

            <button className={`ve-btn ve-btn--apply ${!hasChanges ? 've-btn--disabled' : ''}`}
              onClick={applyChanges} disabled={sending || !hasChanges}>
              {sent ? '✓ 적용됨!' : sending ? '...' : '✓ 적용'}
            </button>
            <button className={`ve-btn ve-btn--send ${!hasChanges ? 've-btn--disabled' : ''}`}
              onClick={sendChanges} disabled={sending || !hasChanges}>
              {sent ? '✓ 전송됨!' : sending ? '전송 중...' : '📨 전송'}
            </button>
          </div>
        )}
        <button className={`ve-toggle ${active ? 've-toggle--on' : ''}`}
          onClick={() => setActive(a => !a)}
          title={active ? '편집 끝' : '편집 모드'}>
          {active ? '✕' : '✏️'}
        </button>
      </div>
    </>
  )
}
