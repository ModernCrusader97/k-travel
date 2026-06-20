const express = require('express')
const https = require('https')
const fs = require('fs')
const path = require('path')

// ── Page Maker (include when building new pages, remove when done) ──
const pageMaker = require('/home/claude/service/page-maker/api')
// ────────────────────────────────────────────────────────────────────

// ── KONDA API ────────────────────────────────────────────────────────
const { router: kondaApi, initDb } = require('./api.cjs')
// ────────────────────────────────────────────────────────────────────

// ── Twitch Drops 대시보드 (별도 도메인: twitch-drops.willdcard.com) ──
const dropsRouter = require('/home/claude/service/twitch_drops_server.cjs')
// ────────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())

// twitch-drops 도메인은 별도 라우터로 처리
app.use((req, res, next) => {
  if (req.hostname === 'twitch-drops.willdcard.com') {
    return dropsRouter(req, res, next)
  }
  next()
})

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = '8107496343'

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, res => { res.on('data', () => {}); res.on('end', resolve) })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// Send CSS changes to Claude via Telegram
app.post('/api/send-changes', async (req, res) => {
  const { changes } = req.body
  if (!changes || Object.keys(changes).length === 0) {
    return res.json({ ok: true, note: '변경사항 없음' })
  }

  // Apply to source files (same as apply-changes)
  const cssPath = path.join(__dirname, 'src/App.css')
  let cssContent = fs.readFileSync(cssPath, 'utf-8')
  let applied = false
  for (const [label, value] of Object.entries(changes)) {
    if (!value) continue
    let cssProps = {}
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') cssProps = parsed
    } catch {
      const txMatch = value.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
      if (txMatch) cssProps['transform'] = `translate(${txMatch[1]}px, ${txMatch[2]}px)`
      const wm = value.match(/width:\s*([\d.]+px)/); if (wm) cssProps['width'] = wm[1]
      const hm = value.match(/height:\s*([\d.]+px)/); if (hm) cssProps['height'] = hm[1]
    }
    if (Object.keys(cssProps).length > 0) {
      cssContent = setCssProps(cssContent, label, cssProps)
      applied = true
    }
  }
  if (applied) fs.writeFileSync(cssPath, cssContent)

  // Send summary to Telegram
  const lines = ['🎨 *레이아웃 편집 전송*\n']
  for (const [label, value] of Object.entries(changes)) {
    lines.push(`*${label}*`)
    lines.push(`\`${value}\``)
  }
  lines.push(applied ? '\n_✅ 소스 파일 자동 적용됨_' : '\n_✏ 웹사이트 비주얼 에디터에서 전송됨_')

  try {
    await sendTelegram(lines.join('\n'))
    res.json({ ok: true, applied })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Build the CSS selector for a given key (data-edit label or raw CSS selector)
function buildSelector(key) {
  // If it looks like a CSS path selector (contains > or . or # or :), use as-is
  if (/[>.:# ]/.test(key)) return key
  return `[data-edit="${key}"]`
}

// Update or create a CSS rule (always in-place, never duplicates)
function setCssProps(css, label, props) {
  const selector = buildSelector(label)
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRe = new RegExp(`(${esc}\\s*\\{)([^}]*)(\\})`, 's')
  if (blockRe.test(css)) {
    return css.replace(blockRe, (_, open, body, close) => {
      let b = body
      for (const [k, v] of Object.entries(props)) {
        const propRe = new RegExp(`${k.replace(/-/g,'\\-')}:[^;]+;`)
        b = propRe.test(b) ? b.replace(propRe, `${k}: ${v};`) : b.trimEnd() + ` ${k}: ${v};`
      }
      return `${open}${b}${close}`
    })
  }
  const propsStr = Object.entries(props).map(([k, v]) => `${k}: ${v};`).join(' ')
  return css + `\n${selector} { ${propsStr} }\n`
}

// Apply changes directly to source files
app.post('/api/apply-changes', async (req, res) => {
  const { changes, textChanges } = req.body
  console.log('[apply-changes] received:', JSON.stringify(changes), 'text:', JSON.stringify(textChanges))
  if ((!changes || Object.keys(changes).length === 0) && (!textChanges || Object.keys(textChanges).length === 0)) {
    return res.json({ ok: true })
  }

  const homePath = path.join(__dirname, 'src/pages/Home.tsx')
  const cssPath = path.join(__dirname, 'src/App.css')
  let homeContent = fs.readFileSync(homePath, 'utf-8')
  let cssContent = fs.readFileSync(cssPath, 'utf-8')
  let changed = false

  for (const [label, value] of Object.entries(changes)) {
    if (!value) continue

    // Text content changes: "text: <html>"
    const textMatch = value.match(/^text:\s*([\s\S]+)/)
    if (textMatch) {
      const rawHtml = textMatch[1]
      const jsxHtml = rawHtml.replace(/<br\s*\/?>/gi, '<br />')
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Find the tag name of the element with this data-edit attribute
      const tagNameMatch = homeContent.match(new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)\\s[^>]*data-edit="${escapedLabel}"`))
      if (tagNameMatch) {
        const tagName = tagNameMatch[1]
        const fullPattern = new RegExp(
          `(<${tagName}\\s[^>]*data-edit="${escapedLabel}"[^>]*>)([\\s\\S]*?)(<\\/${tagName}>)`
        )
        const replaced = homeContent.replace(fullPattern, (m, open, inner, close) => {
          const isInline = !inner.includes('\n')
          if (isInline) return `${open}${jsxHtml}${close}`
          return `${open}\n            ${jsxHtml}\n          ${close}`
        })
        if (replaced !== homeContent) {
          homeContent = replaced
          changed = true
        }
      }
    }

    // JSON format (new page-maker): all CSS props as object
    let cssProps = {}
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') cssProps = parsed
    } catch {
      // Legacy string format (VisualEditor.tsx)
      const txMatch = value.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
      if (txMatch) {
        const rotMatch2  = value.match(/rotate:\s*([-\d.]+deg)/)
        const scaleMatch = value.match(/scale:\s*([\d.]+)/)
        let tf = `translate(${txMatch[1]}px, ${txMatch[2]}px)`
        if (rotMatch2) tf += ` rotate(${rotMatch2[1]})`
        if (scaleMatch && Math.abs(parseFloat(scaleMatch[1]) - 1) > 0.001) tf += ` scale(${parseFloat(scaleMatch[1]).toFixed(3)})`
        cssProps['transform'] = tf
      }
      const widthMatch  = value.match(/width:\s*([\d.]+px)/)
      const heightMatch = value.match(/height:\s*([\d.]+px)/)
      if (widthMatch)  cssProps['width']  = widthMatch[1]
      if (heightMatch) cssProps['height'] = heightMatch[1]
    }

    // For card elements with inline TSX style, update Home.tsx for left/rotate
    const cardMap = { '블랙카드': 'card-black', '화이트카드': 'card-white', '옐로우카드': 'card-yellow', '레드카드': 'card-red', '블루카드': 'card-blue' }
    const cardKey2 = label.replace(/\s/g, '')
    if (cardMap[cardKey2] && cssProps['left']) {
      const imgName = cardMap[cardKey2]
      const newLeft = cssProps['left']
      const newRot  = (cssProps['transform'] || '').match(/rotate\(([^)]+)\)/)
      homeContent = homeContent.replace(
        new RegExp(`(data-edit="${label}"[^>]*style=\\{\\{[^}]*)(left:\\s*'[^']*')(.*?)(transform:\\s*'rotate\\([^)]*\\)')(.*?${imgName})`,'s'),
        (m, p1, _l, p3, _t, p5) => `${p1}left: '${newLeft}'${p3}transform: 'rotate(${newRot ? newRot[1] : '0deg'})'${p5}`
      )
      changed = true
    }

    if (Object.keys(cssProps).length > 0) {
      cssContent = setCssProps(cssContent, label, cssProps)
      changed = true
    }
  }

  // Handle text content changes (from textChanges)
  if (textChanges && Object.keys(textChanges).length > 0) {
    // Collect all TSX source files
    const srcDir = path.join(__dirname, 'src')
    const tsxFiles = [homePath]
    function walkSrc(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkSrc(full)
        else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) && full !== homePath) tsxFiles.push(full)
      }
    }
    walkSrc(srcDir)

    const fileContents = {}
    for (const f of tsxFiles) fileContents[f] = fs.readFileSync(f, 'utf-8')

    for (const [label, rawHtml] of Object.entries(textChanges)) {
      if (!rawHtml) continue
      // Strip .pm-txed class from selector (added by editor during editing)
      const cleanLabel = label.replace(/\.pm-txed/g, '')
      // Extract plain text content (strip input/select/button elements)
      const textContent = rawHtml
        .replace(/<input[^>]*>/gi, '').replace(/<input[^>]*\/>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()

      let applied = false
      // 1. Try data-edit attribute match across all files
      for (const f of tsxFiles) {
        const content = fileContents[f]
        const escapedLabel = cleanLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const tagNameMatch = content.match(new RegExp(`<([a-zA-Z][a-zA-Z0-9]*)\\s[^>]*data-edit="${escapedLabel}"`))
        if (tagNameMatch) {
          const tagName = tagNameMatch[1]
          const jsxHtml = rawHtml.replace(/<br\s*\/?>/gi, '<br />')
          const fullPattern = new RegExp(`(<${tagName}\\s[^>]*data-edit="${escapedLabel}"[^>]*>)([\\s\\S]*?)(<\\/${tagName}>)`)
          const replaced = content.replace(fullPattern, (m, open, inner, close) => {
            const isInline = !inner.includes('\n')
            if (isInline) return `${open}${jsxHtml}${close}`
            return `${open}\n            ${jsxHtml}\n          ${close}`
          })
          if (replaced !== content) { fileContents[f] = replaced; changed = true; applied = true }
        }
      }

      // 2. If no data-edit match, find by className + optional nth-of-type from CSS selector
      if (!applied && textContent) {
        const parts = cleanLabel.split(/\s*>\s*/)
        const lastPart = parts[parts.length - 1]
        const tagMatch = lastPart.match(/^([a-zA-Z][a-zA-Z0-9]*)\.([a-zA-Z][a-zA-Z0-9-]*)/)
        const nthMatch = lastPart.match(/:nth-of-type\((\d+)\)/)
        const targetNth = nthMatch ? parseInt(nthMatch[1]) : null // null = replace all matches
        if (tagMatch) {
          const [, tagName, className] = tagMatch
          for (const f of tsxFiles) {
            let content = fileContents[f]
            const elRe = new RegExp(
              `(<${tagName}\\s[^>]*className="(?:[^"]*[ ])?${className}(?:[ "][^"]*|")[^>]*?>)([\\s\\S]*?)(<\\/${tagName}>)`, 'g'
            )
            let matchCount = 0
            const newContent = content.replace(elRe, (full, open, inner, close) => {
              matchCount++
              // If nth-of-type is specified, only modify that occurrence
              if (targetNth !== null && matchCount !== targetNth) return full
              // Find text after the last JSX self-closing tag (handles arrow fns with >)
              const lastSlashGt = inner.lastIndexOf('/>')
              const textPart = (lastSlashGt >= 0 ? inner.substring(lastSlashGt + 2) : inner).trim()
              if (!textPart || textPart === textContent) return full
              // Replace only the text portion, keep everything before /> intact
              const prefix = lastSlashGt >= 0 ? inner.substring(0, lastSlashGt + 2) : ''
              const indent = (inner.match(/\n(\s+)$/) || ['', '              '])[1]
              const newInner = prefix ? `${prefix}\n${indent}${textContent}\n${indent.slice(2)}` : `\n${indent}${textContent}\n${indent.slice(2)}`
              changed = true; applied = true
              return `${open}${newInner}${close}`
            })
            if (newContent !== content) fileContents[f] = newContent
          }
        }
      }
    }
    // Write updated files
    for (const f of tsxFiles) {
      if (fileContents[f] !== fs.readFileSync(f, 'utf-8')) fs.writeFileSync(f, fileContents[f])
    }
  }

  console.log('[apply-changes] changed:', changed)
  if (changed) {
    fs.writeFileSync(homePath, homeContent)
    fs.writeFileSync(cssPath, cssContent)
    console.log('[apply-changes] files written OK')
  }

  res.json({ ok: true, applied: changed })

  if (changed) {
    const cssSummary = Object.entries(changes || {}).filter(([,v])=>v).map(([k, v]) => `*${k}*: \`${v}\``).join('\n')
    const textSummary = Object.keys(textChanges || {}).map(k => `*${k}*: 텍스트 수정`).join('\n')
    const summary = [cssSummary, textSummary].filter(Boolean).join('\n')
    if (summary) sendTelegram(`✅ *변경사항 자동 적용됨*\n\n${summary}\n\n_Vite HMR로 페이지 자동 갱신_`).catch(() => {})
  }
})

// Export project from Web Page Maker → apply to KONDA source files
app.post('/api/export-project', async (req, res) => {
  const { project } = req.body
  if (!project) return res.status(400).json({ ok: false })

  // Rebuild Home.tsx from project data
  const cards = project.blocks.find(b => b.type === 'cards-fan')
  const cardDivs = (cards?.cards ?? []).map(c =>
    `          <div className="fan-card" data-edit="${c.alt.replace(' 카드', '')}카드" data-edit-type="card" style={{ left: '${c.left}%', transform: 'rotate(${c.rotate}deg)', zIndex: ${c.zIndex} }}>\n            <img src="${c.image}" alt="${c.alt}" className="fan-card-img" />\n          </div>`
  ).join('\n')

  const app = project.blocks.find(b => b.type === 'app-section')
  const appImgWidth = app?.props?.imageWidth?.value ?? 600
  const appHeading = app?.props?.heading?.value ?? ''
  const hero = project.blocks.find(b => b.type === 'hero')
  const heroHeading = hero?.props?.heading?.value ?? ''
  const promo = project.blocks.find(b => b.type === 'promo-bar')

  const homePath = path.join(__dirname, 'src/pages/Home.tsx')
  const cssPath = path.join(__dirname, 'src/App.css')

  // Update card positions in Home.tsx
  let homeContent = fs.readFileSync(homePath, 'utf-8')
  ;(cards?.cards ?? []).forEach(c => {
    const label = c.alt.replace(' 카드', '') + '카드'
    homeContent = homeContent.replace(
      new RegExp(`(data-edit="${label}"[^>]*style=\\{\\{)[^}]*(\\}\\})`),
      `$1 left: '${c.left}%', transform: 'rotate(${c.rotate}deg)', zIndex: ${c.zIndex} $2`
    )
  })

  // Update app image width in CSS
  let cssContent = fs.readFileSync(cssPath, 'utf-8')
  cssContent = cssContent.replace(
    /\.app-mockup-img \{[^}]*width:\s*[\d]+px/,
    `.app-mockup-img { width: ${appImgWidth}px`
  )

  fs.writeFileSync(homePath, homeContent)
  fs.writeFileSync(cssPath, cssContent)

  const summary = `🚀 *Web Page Maker → KONDA 내보내기 완료*\n\n` +
    (cards?.cards ?? []).map(c => `*${c.alt}*: left ${c.left}%, rotate ${c.rotate}°`).join('\n') +
    `\n\n*앱 이미지 너비*: ${appImgWidth}px`

  await sendTelegram(summary).catch(() => {})
  res.json({ ok: true })
})

// ── Page Maker routes ──
app.use('/page-maker', pageMaker)
// ──────────────────────

app.use('/api', kondaApi)
initDb().catch(console.error)

app.listen(3001, () => console.log('Dev API on :3001'))
